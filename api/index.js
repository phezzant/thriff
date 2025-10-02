require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; 

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(500).json({ error: 'ADMIN_TOKEN not set on server' });
  const token = req.get('x-admin-token') || '';
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_DB_PATH = path.join(__dirname, 'var', 'data.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

const dir = path.dirname(DB_PATH);
if (!dir.startsWith('/data')) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log('[db] Using DB at:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  city TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

function ensureColumn(table, col, def) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const has = info.some(c => c.name === col);
  if (!has) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
    console.log(`[db] Added column ${table}.${col}`);
  }
}

ensureColumn('listings', 'likes',   'INTEGER NOT NULL DEFAULT 0');
ensureColumn('listings', 'status',  'TEXT NOT NULL DEFAULT "active"'); // active | sold | hidden
ensureColumn('listings', 'deleted', 'INTEGER NOT NULL DEFAULT 0');     // 0=false, 1=true

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/listings', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const page  = Math.max(Number(req.query.page)  || 1, 1);
  const offset = (page - 1) * limit;

  const where = 'WHERE deleted = 0';
  const items = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at, likes, status
    FROM listings
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare(`SELECT COUNT(*) AS c FROM listings ${where}`).get().c;

  res.json({ items, page, limit, total, pageCount: Math.ceil(total / limit) });
});

app.get('/api/listings/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM listings WHERE id = ? AND deleted = 0`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const rows = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at, likes, status
    FROM listings
    WHERE deleted = 0 AND (title LIKE ? OR description LIKE ?)
    ORDER BY created_at DESC
    LIMIT 50
  `).all(like, like);
  res.json(rows);
});

app.post('/api/listings', (req, res) => {
  const { title, description, price, imageUrl, city } = req.body;

  if (!title || !description || price === undefined) {
    return res.status(400).json({ error: 'title, description, price are required' });
  }
  const priceCents = Math.round(Number(price) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  const info = db.prepare(`
    INSERT INTO listings (title, description, price_cents, image_url, city)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description, priceCents, imageUrl || null, city || null);

  const created = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.post('/api/listings/:id/like', (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare(`UPDATE listings SET likes = likes + 1 WHERE id = ? AND deleted = 0`).run(id);
  if (!r.changes) return res.status(404).json({ error: 'Not found' });
  const { likes } = db.prepare(`SELECT likes FROM listings WHERE id = ?`).get(id);
  res.json({ id, likes });
});

app.post('/api/listings/:id/unlike', (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare(`
    UPDATE listings SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END
    WHERE id = ? AND deleted = 0
  `).run(id);
  if (!r.changes) return res.status(404).json({ error: 'Not found' });
  const { likes } = db.prepare(`SELECT likes FROM listings WHERE id = ?`).get(id);
  res.json({ id, likes });
});

// PATCH /api/listings/:id  (admin)
app.patch('/api/listings/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, description, price, imageUrl, city, status } = req.body;

  const fields = [], values = [];
  if (title !== undefined)       { fields.push('title = ?');       values.push(String(title)); }
  if (description !== undefined) { fields.push('description = ?'); values.push(String(description)); }
  if (price !== undefined)       {
    const priceCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) return res.status(400).json({ error: 'Invalid price' });
    fields.push('price_cents = ?'); values.push(priceCents);
  }
  if (imageUrl !== undefined)    { fields.push('image_url = ?');   values.push(imageUrl || null); }
  if (city !== undefined)        { fields.push('city = ?');        values.push(city || null); }
  if (status !== undefined)      {
    if (!['active','sold','hidden'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    fields.push('status = ?'); values.push(status);
  }
  if (fields.length === 0) return res.status(400).json({ error: 'No updates' });

  values.push(id);
  const info = db.prepare(`UPDATE listings SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  const item = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(id);
  res.json(item);
});

// DELETE /api/listings/:id  (admin, soft delete)
app.delete('/api/listings/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare(`UPDATE listings SET deleted = 1 WHERE id = ?`).run(id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

app.post('/api/admin/seed', requireAdmin, (req, res) => {
  const items = [
    { title: 'MacBook Air M1', description: '8GB/256GB, great battery', price: 650, imageUrl: 'https://picsum.photos/seed/mba/600/400', city: 'Tallinn' },
    { title: 'Road Bike', description: 'Aluminum frame, size M',       price: 220, imageUrl: 'https://picsum.photos/seed/bike/600/400', city: 'Tartu' },
    { title: 'PS5 Digital', description: 'Two controllers, 5 games',    price: 380, imageUrl: 'https://picsum.photos/seed/ps5/600/400', city: 'Pärnu' },
    { title: 'Leather Sofa', description: '3-seater, brown',            price: 200, imageUrl: 'https://picsum.photos/seed/sofa/600/400', city: 'Narva' },
    { title: 'Winter Jacket', description: 'Size M, warm & light',      price: 45,  imageUrl: 'https://picsum.photos/seed/jacket/600/400', city: 'Tallinn' },
  ];

  const stmt = db.prepare(`INSERT INTO listings (title, description, price_cents, image_url, city) VALUES (?, ?, ?, ?, ?)`);
  const tx = db.transaction((arr) => {
    for (const x of arr) {
      const c = Math.round(Number(x.price) * 100);
      stmt.run(x.title, x.description, c, x.imageUrl || null, x.city || null);
    }
  });
  tx(items);

  res.json({ inserted: items.length });
});

const allowed = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (allowed.includes('*') || !origin) return cb(null, true);
    cb(null, allowed.includes(origin) ? true : new Error('Not allowed by CORS'));
  }
}));

// --- Seed 100+ baby clothing items -----------------------------------------
app.post('/api/admin/seed/baby', requireAdmin, (req, res) => {
  const count = Math.min(Number(req.query.count) || 100, 500);

  const types = [
    'Onesie','Bodysuit','Sleepsuit','Romper','Coverall','Pyjamas','Sleeping Bag',
    'T-shirt','Long Sleeve Tee','Sweatshirt','Hoodie','Cardigan','Vest',
    'Pants','Leggings','Joggers','Shorts','Skirt','Tights','Dungarees',
    'Dress','Outfit Set','Onesie Set','Cardigan Set',
    'Jacket','Fleece Jacket','Puffer Jacket','Rain Suit','Snowsuit','Gilet',
    'Hat','Beanie','Cap','Balaclava','Scarf','Mittens','Gloves','Socks','Booties',
    'Bib','Swaddle','Blanket','Thermal Set','Bamboo Bodysuit','Organic Cotton Bodysuit'
  ];
  const sizes = ['NB','0-3m','3-6m','6-9m','9-12m','12-18m','18-24m','2T','3T'];
  const colors = ['cream','white','grey','blue','navy','green','olive','pink','peach','yellow','brown','black'];
  const seasons = ['All-season','Spring','Summer','Autumn','Winter'];
  const brands = ['H&M','Zara','Next',"Carter's",'Gap','Lindex','Name It','M&S','Uniqlo','Petit Bateau','Polarn O. Pyret'];
  const materials = ['organic cotton','cotton','bamboo blend','merino blend','fleece','waterproof shell'];
  const conditions = ['New with tags','Like new','Excellent used condition','Good used condition','Well-loved'];
  const cities = ['Tallinn','Tartu','Pärnu','Narva'];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function priceFor(type) {
    // Rough ranges (EUR)
    const t = type.toLowerCase();
    let min=3, max=20;
    if (/(jacket|snowsuit|rain|puffer)/.test(t)) { min=18; max=60; }
    else if (/(sleep|blanket|bag)/.test(t))     { min=10; max=35; }
    else if (/(set)/.test(t))                   { min=12; max=40; }
    return Math.round((min + Math.random()*(max-min)) * 100); // cents
  }

  const items = [];
  for (let i = 0; i < count; i++) {
    const type = pick(types);
    const size = pick(sizes);
    const color = pick(colors);
    const brand = pick(brands);
    const material = pick(materials);
    const season = pick(seasons);
    const condition = pick(conditions);
    const city = pick(cities);

    const title = `${brand} ${type} - ${size} - ${color}`;
    const desc = [
      `${condition} ${type.toLowerCase()} in ${color}.`,
      `Size ${size}. ${season}. Soft ${material}.`,
      `Freshly washed and from smoke-free home.`
    ].join(' ');

    const price_cents = priceFor(type);
    const price = price_cents / 100; // your POST /api/listings expects 'price' in EUR
    const imageUrl = `https://picsum.photos/seed/baby-${i + 1}/600/400`;

    items.push({ title, description: desc, price, imageUrl, city });
  }

  const stmt = db.prepare(
    `INSERT INTO listings (title, description, price_cents, image_url, city)
     VALUES (?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((arr) => {
    for (const x of arr) {
      stmt.run(x.title, x.description, Math.round(x.price * 100), x.imageUrl, x.city);
    }
  });

  tx(items);
  res.json({ inserted: items.length });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
