const { Router } = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/admin');

const r = Router();

// simple seed (your original 5 items)
r.post('/admin/seed', requireAdmin, (req, res) => {
  const items = [
    { title: 'MacBook Air M1', description: '8GB/256GB, great battery', price: 650, imageUrl: 'https://picsum.photos/seed/mba/600/400', city: 'Tallinn' },
    { title: 'Road Bike', description: 'Aluminum frame, size M',       price: 220, imageUrl: 'https://picsum.photos/seed/bike/600/400', city: 'Tartu' },
    { title: 'PS5 Digital', description: 'Two controllers, 5 games',    price: 380, imageUrl: 'https://picsum.photos/seed/ps5/600/400', city: 'Pärnu' },
    { title: 'Leather Sofa', description: '3-seater, brown',            price: 200, imageUrl: 'https://picsum.photos/seed/sofa/600/400', city: 'Narva' },
    { title: 'Winter Jacket', description: 'Size M, warm & light',      price: 45,  imageUrl: 'https://picsum.photos/seed/jacket/600/400', city: 'Tallinn' },
  ];
  const stmt = db.prepare(`INSERT INTO listings (title, description, price_cents, image_url, city) VALUES (?, ?, ?, ?, ?)`);
  const tx = db.transaction(arr => arr.forEach(x => stmt.run(x.title, x.description, Math.round(Number(x.price) * 100), x.imageUrl || null, x.city || null)));
  tx(items);
  res.json({ inserted: items.length });
});

// big baby-seed (move your existing handler here unchanged)
r.post('/admin/seed/baby', requireAdmin, (req, res) => {
  // paste your existing baby seed code here
  res.json({ inserted: 0 });
});

module.exports = r;
