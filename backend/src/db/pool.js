const { Pool } = require("pg");

let databaseUrl = process.env.DATABASE_URL || "";

databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, "");

console.log("DATABASE_URL existe:", !!databaseUrl);

let parsedUrl;

try {
  parsedUrl = new URL(databaseUrl);

  console.log("========== CONFIGURACIÓN DB ==========");
  console.log("DB host:", parsedUrl.hostname);
  console.log("DB port:", parsedUrl.port || "5432");
  console.log("DB database:", parsedUrl.pathname);
  console.log("DB user:", parsedUrl.username);
  console.log("======================================");
} catch (err) {
  console.error("❌ DATABASE_URL inválida:", err.message);
  throw err;
}

const isLocal =
  parsedUrl.hostname === "localhost" ||
  parsedUrl.hostname === "127.0.0.1";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  host: parsedUrl.hostname,
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en PostgreSQL:", err);
});

module.exports = pool;