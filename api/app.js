const express = require('express');
const cors = require('cors');
const { CORS_ORIGIN } = require('./config');
require('./db/migrate')(); // run migrations once at startup

const app = express();
app.use(express.json());

// strict-ish CORS
app.use(cors({
  origin: (origin, cb) => {
    if (CORS_ORIGIN.includes('*') || !origin) return cb(null, true);
    cb(null, CORS_ORIGIN.includes(origin) ? true : new Error('Not allowed by CORS'));
  }
}));

// mount routers under /api
app.use('/api', require('./routes/health'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/listings'));
app.use('/api', require('./routes/admin'));

module.exports = app;
