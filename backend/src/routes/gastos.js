const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// 📥 OBTENER GASTOS (CON FILTROS DE FECHA)
// ============================================
router.get("/", requireAuth, async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  let query = `
    SELECT id, descripcion, fecha, valor, forma_pago, usuario, created_at
    FROM gastos
  `;
  const params = [];
  const conditions = [];

  if (fechaInicio) {
    conditions.push(`fecha >= $${params.length + 1}`);
    params.push(fechaInicio);
  }
  if (fechaFin) {
    conditions.push(`fecha <= $${params.length + 1}`);
    params.push(fechaFin);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY fecha DESC, id DESC`;

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /gastos:", err);
    res.status(500).json({ error: "Error al cargar los gastos." });
  }
});

// ============================================
// ➕ CREAR UN NUEVO GASTO
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { descripcion, fecha, valor, formaPago, usuario } = req.body;

  if (!descripcion || !fecha || valor == null) {
    return res.status(400).json({ error: "Descripción, fecha y valor son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO gastos (descripcion, fecha, valor, forma_pago, usuario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, descripcion, fecha, valor, forma_pago, usuario`,
      [descripcion, fecha, valor, formaPago || null, usuario || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /gastos:", err);
    res.status(500).json({ error: "Error al crear el gasto." });
  }
});

// ============================================
// ✏️ ACTUALIZAR UN GASTO
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { descripcion, fecha, valor, formaPago, usuario } = req.body;

  if (!descripcion || !fecha || valor == null) {
    return res.status(400).json({ error: "Descripción, fecha y valor son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE gastos 
       SET descripcion = $1, fecha = $2, valor = $3, forma_pago = $4, usuario = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, descripcion, fecha, valor, forma_pago, usuario`,
      [descripcion, fecha, valor, formaPago, usuario, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /gastos/:id:", err);
    res.status(500).json({ error: "Error al actualizar el gasto." });
  }
});

// ============================================
// 🗑️ ELIMINAR UN GASTO
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM gastos WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Gasto no encontrado." });
    }
    res.json({ message: "Gasto eliminado correctamente." });
  } catch (err) {
    console.error("Error en DELETE /gastos/:id:", err);
    res.status(500).json({ error: "Error al eliminar el gasto." });
  }
});

module.exports = router;