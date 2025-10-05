require('dotenv').config();
const { DB_PATH } = require('./config');
console.log('[db] Using DB at:', DB_PATH);

const app = require('./app');
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
