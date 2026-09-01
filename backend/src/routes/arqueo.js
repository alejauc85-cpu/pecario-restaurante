const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// OBTENER ARQUEOS POR FECHA
// GET /api/arqueo
// GET /api/arqueo?fecha=2026-08-16
// ============================================
router.get("/", requireAuth, async (req, res) => {
  const { fecha } = req.query;

  try {
    let query = `
      SELECT
        id,
        fecha,
        apertura,
        conteo,
        valor_esperado,
        diferencia,
        usuario,
        hora_apertura,
        created_at
      FROM arqueo_caja
    `;

    const params = [];

    if (fecha) {
      query += ` WHERE fecha = $1`;
      params.push(fecha);
    }

    query += `
      ORDER BY fecha DESC, created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    res.json(rows);
  } catch (err) {
    console.error("Error en GET /arqueo:", err);

    res.status(500).json({
      error: "Error al cargar los arqueos."
    });
  }
});

// ============================================
// OBTENER EL ARQUEO DE HOY
// GET /api/arqueo/hoy
// ============================================
router.get("/hoy", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        id,
        fecha,
        apertura,
        conteo,
        valor_esperado,
        diferencia,
        usuario,
        hora_apertura,
        created_at
       FROM arqueo_caja
       WHERE fecha = CURRENT_DATE
       ORDER BY created_at DESC
       LIMIT 1`
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error("Error en GET /arqueo/hoy:", err);

    res.status(500).json({
      error: "Error al cargar el arqueo de hoy."
    });
  }
});

// ============================================
// GUARDAR APERTURA DE CAJA
// POST /api/arqueo
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    fecha,
    apertura,
    hora_apertura,
    usuario
  } = req.body;

  if (!fecha || apertura == null) {
    return res.status(400).json({
      error: "Fecha y apertura son obligatorios."
    });
  }

  try {
    const { rows: existing } = await pool.query(
      `SELECT id
       FROM arqueo_caja
       WHERE fecha = $1`,
      [fecha]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Ya existe una apertura de caja para esta fecha."
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO arqueo_caja (
        fecha,
        apertura,
        hora_apertura,
        usuario
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        fecha,
        apertura,
        hora_apertura,
        usuario`,
      [
        fecha,
        apertura,
        hora_apertura || null,
        usuario || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /arqueo:", err);

    res.status(500).json({
      error: "Error al guardar la apertura de caja."
    });
  }
});

// ============================================
// GUARDAR CIERRE DE CAJA
// PUT /api/arqueo/:id
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const {
    conteo,
    valorEsperado,
    diferencia,
    usuario
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE arqueo_caja
       SET
        conteo = $1,
        valor_esperado = $2,
        diferencia = $3,
        usuario = $4
       WHERE id = $5
       RETURNING
        id,
        fecha,
        apertura,
        conteo,
        valor_esperado,
        diferencia,
        hora_apertura,
        usuario`,
      [
        conteo,
        valorEsperado,
        diferencia,
        usuario,
        id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Arqueo no encontrado."
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /arqueo/:id:", err);

    res.status(500).json({
      error: "Error al guardar el cierre de caja."
    });
  }
});

// ============================================
// REABRIR CAJA (deshacer un cierre por error)
// PATCH /api/arqueo/:id/reabrir
// ============================================
router.patch("/:id/reabrir", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `UPDATE arqueo_caja
       SET
        conteo = NULL,
        valor_esperado = NULL,
        diferencia = NULL
       WHERE id = $1
       RETURNING
        id,
        fecha,
        apertura,
        conteo,
        valor_esperado,
        diferencia,
        hora_apertura,
        usuario`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Arqueo no encontrado."
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PATCH /arqueo/:id/reabrir:", err);

    res.status(500).json({
      error: "Error al reabrir la caja."
    });
  }
});
module.exports = router;