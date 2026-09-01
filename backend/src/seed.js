require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./db/pool");

const MENU = [
  {
    slug: "entradas",
    label: "Entradas",
    visibleRoles: ["admin", "empleado"],
    items: [
      { name: "Arepa de choclo con hogao", price: 14000, pricePlatforms: 15500, prep: "Plancha · 6 min" },
      { name: "Patacones con guacamole", price: 16000, pricePlatforms: 17800, prep: "Freidora · 5 min" },
      { name: "Empanadas de pollo (x4)", price: 12000, pricePlatforms: 13500, prep: "Freidora · 4 min" },
    ],
  },
  {
    slug: "fuertes",
    label: "Platos fuertes",
    visibleRoles: ["admin", "empleado"],
    items: [
      { name: "Bandeja paisa", price: 38000, pricePlatforms: 42000, prep: "Parrilla + fogón · 18 min" },
      { name: "Sobrebarriga a la brasa", price: 42000, pricePlatforms: 46000, prep: "Brasa lenta · 25 min" },
      { name: "Trucha en salsa de mora", price: 36000, pricePlatforms: 39500, prep: "Plancha · 12 min" },
      { name: "Ajiaco santafereño", price: 32000, pricePlatforms: 35500, prep: "Fogón · 15 min" },
    ],
  },
  {
    slug: "bebidas",
    label: "Bebidas",
    visibleRoles: ["admin", "empleado"],
    items: [
      { name: "Limonada de coco", price: 9000, pricePlatforms: 10000 },
      { name: "Jugo de lulo", price: 8000, pricePlatforms: 9000 },
      { name: "Cerveza artesanal", price: 11000, pricePlatforms: 12500 },
    ],
  },
  {
    slug: "postres",
    label: "Postres",
    visibleRoles: ["admin", "empleado"],
    items: [
      { name: "Tres leches", price: 13000, pricePlatforms: 14500, prep: "Vitrina fría" },
      { name: "Obleas con arequipe", price: 9000, pricePlatforms: 10000, prep: "Montaje · 2 min" },
    ],
  },
  {
    slug: "gestion",
    label: "Gestión y costos",
    visibleRoles: ["admin"],
    items: [
      { name: "Costo insumos — Bandeja paisa", price: 16500 },
      { name: "Costo insumos — Sobrebarriga", price: 18000 },
      { name: "Margen promedio del mes", price: null, note: "42%" },
    ],
  },
];

const DEMO_USERS = [
  { username: "admin@pecario.com", password: "admin123", role: "admin" },
  { username: "empleado@pecario.com", password: "empleado123", role: "empleado" },
];

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("✔ Esquema aplicado.");

  await pool.query("TRUNCATE menu_items, menu_categories RESTART IDENTITY CASCADE");
  await pool.query("TRUNCATE users RESTART IDENTITY CASCADE");

  for (const user of DEMO_USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      [user.username, hash, user.role]
    );
  }
  console.log(`✔ ${DEMO_USERS.length} usuarios de prueba creados.`);

  for (let i = 0; i < MENU.length; i++) {
    const cat = MENU[i];
    const { rows } = await pool.query(
      `INSERT INTO menu_categories (slug, label, sort_order, visible_roles)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [cat.slug, cat.label, i, cat.visibleRoles]
    );
    const categoryId = rows[0].id;

    for (let j = 0; j < cat.items.length; j++) {
      const item = cat.items[j];
      await pool.query(
        `INSERT INTO menu_items (category_id, name, price, price_platforms, prep, note, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [categoryId, item.name, item.price ?? null, item.pricePlatforms ?? null, item.prep ?? null, item.note ?? null, j]
      );
    }
  }
  console.log(`✔ ${MENU.length} categorías y sus ítems creados.`);

  console.log("\nUsuarios de prueba:");
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(8)} → ${u.username} / ${u.password}`));

  await pool.end();
}

run().catch((err) => {
  console.error("Error en el seed:", err);
  process.exit(1);
});