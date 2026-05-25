const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const caPath = path.resolve(
  __dirname,
  '..',
  process.env.DB_SSL_CA_FILE
);

if (!fs.existsSync(caPath)) {
  throw new Error(`❌ CA file not found at: ${caPath}`);
}

console.log("🔐 Using CA file:", caPath);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  ssl: {
    ca: fs.readFileSync(caPath), // IMPORTANT: Buffer, not string
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 20000
});

(async () => {
  try {
    console.log('🔌 Connecting to DB:', process.env.DB_HOST);

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = pool;