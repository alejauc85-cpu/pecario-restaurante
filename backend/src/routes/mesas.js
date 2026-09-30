const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ============================================================
// LISTAR TODAS LAS MESAS
// GET /api/mesas
// ============================================================

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          id,
          number,
          zone,
          is_occupied,
          order_items,
          total,
          opened_at,
          updated_at
       FROM mesas
       ORDER BY
         CASE zone WHEN 'externa' THEN 0 ELSE 1 END,
         number ASC`
    );

    res.json({ mesas: rows });
  } catch (err) {
    console.error("Error en GET /mesas:", err);
    res.status(500).json({ error: "Error al cargar las mesas." });
  }
});

// ============================================================
// OBTENER UNA MESA POR ID
// GET /api/mesas/:id
// ============================================================

router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
          id,
          number,
          zone,
          is_occupied,
          order_items,
          total,
          opened_at,
          updated_at
       FROM mesas
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /mesas/:id:", err);
    res.status(500).json({ error: "Error al cargar la mesa." });
  }
});

// ============================================================
// ACTUALIZAR ESTADO DE UNA MESA
// PUT /api/mesas/:id
// Body: { isOccupied?, orderItems?, total? }
// ============================================================

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { isOccupied, orderItems, total } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE mesas
       SET
         is_occupied = COALESCE($1, is_occupied),
         order_items = COALESCE($2::jsonb, order_items),
         total = COALESCE($3, total),
         opened_at = CASE
           WHEN $1 = TRUE AND is_occupied = FALSE THEN NOW()
           WHEN $1 = FALSE THEN NULL
           ELSE opened_at
         END,
         updated_at = NOW()
       WHERE id = $4
       RETURNING
         id,
         number,
         zone,
         is_occupied,
         order_items,
         total,
         opened_at,
         updated_at`,
      [
        typeof isOccupied === "boolean" ? isOccupied : null,
        orderItems ? JSON.stringify(orderItems) : null,
        typeof total === "number" ? total : null,
        id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /mesas/:id:", err);
    res.status(500).json({ error: "Error al actualizar la mesa." });
  }
});

// ============================================================
// LIBERAR TODAS LAS MESAS (opcional, útil para admin)
// POST /api/mesas/reset
// ============================================================

router.post("/reset", requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE mesas
       SET
         is_occupied = FALSE,
         order_items = '[]'::jsonb,
         total = 0,
         opened_at = NULL,
         updated_at = NOW()`
    );

    res.json({ message: "Todas las mesas fueron liberadas." });
  } catch (err) {
    console.error("Error en POST /mesas/reset:", err);
    res.status(500).json({ error: "Error al reiniciar las mesas." });
  }
});

module.exports = router;