const path = require('path');

const DEFAULT_DB_PATH = path.join(__dirname, 'var', 'data.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || '^ss2^JA!3p9c^cu!IG0VO^';
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*')
  .split(',').map(s => s.trim());

module.exports = { DB_PATH, DEFAULT_DB_PATH, ADMIN_TOKEN, JWT_SECRET, CORS_ORIGIN };
