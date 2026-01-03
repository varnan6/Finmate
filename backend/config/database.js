// config/database.js
const { Pool } = require("pg");
require("dotenv").config();

// Example: use single Supabase URL env
// SUPABASE_DB_URL=postgres://user:pass@host:5432/postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

// Test connection
pool
  .connect()
  .then((client) => {
    console.log("✅ Database connected successfully");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = pool;
