const { Pool } = require("pg");

// Railway (y la mayoría de proveedores cloud de Postgres) requieren SSL,
// pero con un certificado que node no valida por defecto → se desactiva
// la verificación estricta. En tu propia máquina (localhost) no hace falta SSL.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;
