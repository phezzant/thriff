const { Router } = require('express');
const db = require('../db/db');
const { requireUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const r = Router();

// list (paged)
r.get('/listings', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const page  = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;

  const where = 'WHERE deleted = 0';
  const items = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at, likes, status
    FROM listings ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`).all(limit, offset);

  const total = db.prepare(`SELECT COUNT(*) AS c FROM listings ${where}`).get().c;
  res.json({ items, page, limit, total, pageCount: Math.ceil(total / limit) });
});

// detail
r.get('/listings/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM listings WHERE id = ? AND deleted = 0`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// search
r.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const rows = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at, likes, status
    FROM listings
    WHERE deleted = 0 AND (title LIKE ? OR description LIKE ?)
    ORDER BY created_at DESC
    LIMIT 50`).all(like, like);
  res.json(rows);
});

// create
r.post('/listings', requireUser, (req, res) => {
  const { title, description, price, imageUrl, city } = req.body;
  if (!title || !description || price === undefined) return res.status(400).json({ error: 'title, description, price are required' });
  const priceCents = Math.round(Number(price) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0) return res.status(400).json({ error: 'Invalid price' });

  const info = db.prepare(`
    INSERT INTO listings (title, description, price_cents, image_url, city, seller_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description, priceCents, imageUrl || null, city || null, req.user.id);

  const created = db.prepare(`
    SELECT id, title, description, price_cents, image_url, city, created_at, seller_id
    FROM listings WHERE id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(created);
});

// my listings
r.get('/my/listings', requireUser, (req, res) => {
  const rows = db.prepare(`
    SELECT id, title, price_cents, image_url, city, created_at, status, likes
    FROM listings WHERE seller_id = ? AND deleted = 0
    ORDER BY created_at DESC`).all(req.user.id);
  res.json(rows);
});

// likes
r.post('/listings/:id/like', (req, res) => {
  const id = Number(req.params.id);
  const r1 = db.prepare(`UPDATE listings SET likes = likes + 1 WHERE id = ? AND deleted = 0`).run(id);
  if (!r1.changes) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare(`SELECT id, likes FROM listings WHERE id = ?`).get(id));
});

r.post('/listings/:id/unlike', (req, res) => {
  const id = Number(req.params.id);
  const r1 = db.prepare(`
    UPDATE listings SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END
    WHERE id = ? AND deleted = 0`).run(id);
  if (!r1.changes) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare(`SELECT id, likes FROM listings WHERE id = ?`).get(id));
});

// admin: update + delete (soft)
r.patch('/listings/:id', requireAdmin, (req, res) => {
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
  if (!fields.length) return res.status(400).json({ error: 'No updates' });

  values.push(id);
  const info = db.prepare(`UPDATE listings SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare(`SELECT * FROM listings WHERE id = ?`).get(id));
});

r.delete('/listings/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare(`UPDATE listings SET deleted = 1 WHERE id = ?`).run(id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = r;
