const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL no está definida");
} else {
  try {
    const dbUrl = new URL(databaseUrl);

    console.log("========== DATABASE ==========");
    console.log("DB host:", dbUrl.hostname);
    console.log("DB port:", dbUrl.port);
    console.log("DB database:", dbUrl.pathname);
    console.log("DB user:", dbUrl.username);
    console.log("==============================");
  } catch (err) {
    console.error("❌ DATABASE_URL inválida:", err.message);
  }
}

const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl || "");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;