// api/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function makeToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function requireUser(req, res, next) {
  const hdr = req.get('authorization') || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.uid, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { makeToken, requireUser };
