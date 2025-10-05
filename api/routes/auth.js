const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { makeToken, requireUser } = require('../middleware/auth');

const r = Router();

r.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const hash = bcrypt.hashSync(String(password), 10);
  try {
    const info = db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(String(email).toLowerCase(), name || null, hash);
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id=?')
      .get(info.lastInsertRowid);
    res.status(201).json({ user, token: makeToken(user) });
  } catch (e) {
    if (String(e.message).includes('UNIQUE constraint')) return res.status(409).json({ error: 'Email already registered' });
    throw e;
  }
});

r.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const publicUser = { id: user.id, email: user.email, name: user.name, created_at: user.created_at };
  res.json({ user: publicUser, token: makeToken(publicUser) });
});

r.get('/me', requireUser, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id=?').get(req.user.id);
  const counts = db.prepare('SELECT COUNT(*) AS c FROM listings WHERE seller_id = ? AND deleted = 0')
    .get(req.user.id);
  res.json({ user, stats: { listings: counts.c } });
});

module.exports = r;
