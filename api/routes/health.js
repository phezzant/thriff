const { Router } = require('express');
const r = Router();
r.get('/health', (_req, res) => res.json({ ok: true }));
module.exports = r;
