const db = require('./db');

function ensureColumn(table, col, def) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!info.some(c => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
}

function migrate() {
  // listings
  db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    image_url TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  ensureColumn('listings', 'likes',   'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('listings', 'status',  'TEXT NOT NULL DEFAULT "active"');
  ensureColumn('listings', 'deleted', 'INTEGER NOT NULL DEFAULT 0');
  // seller_id
  const info = db.prepare('PRAGMA table_info(listings)').all();
  if (!info.some(c => c.name === 'seller_id')) {
    db.exec('ALTER TABLE listings ADD COLUMN seller_id INTEGER;');
  }

  // users
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
}

module.exports = migrate;
