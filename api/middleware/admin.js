const { ADMIN_TOKEN } = require('../config');
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(500).json({ error: 'ADMIN_TOKEN not set on server' });
  const token = req.get('x-admin-token') || '';
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}
module.exports = { requireAdmin };
