const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use a project-local default first (writable on Render, even on Free)
const DEFAULT_DB_PATH = path.join(__dirname, 'var', 'data.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// Only mkdir for non-/data paths (creating /data without a disk would fail with EACCES)
const dir = path.dirname(DB_PATH);
fs.mkdirSync(dir, { recursive: true }); // ← create parent folder(s) if missing

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

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/listings', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at
    FROM listings
    ORDER BY created_at DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

app.get('/api/listings/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const rows = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at
    FROM listings
    WHERE title LIKE ? OR description LIKE ?
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


const allowed = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (allowed.includes('*') || !origin) return cb(null, true);
    cb(null, allowed.includes(origin) ? true : new Error('Not allowed by CORS'));
  }
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
