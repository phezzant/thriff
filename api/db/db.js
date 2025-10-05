const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DB_PATH } = require('../config');

const dir = path.dirname(DB_PATH);
if (!dir.startsWith('/data')) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

module.exports = db;
