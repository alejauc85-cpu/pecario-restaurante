const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// 📥 OBTENER TODOS LOS CLIENTES
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre_completo, tipo_documento, correo, telefono, celular, created_at
       FROM clientes 
       ORDER BY nombre_completo ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /clientes:", err);
    res.status(500).json({ error: "Error al cargar los clientes." });
  }
});

// ============================================
// 📥 OBTENER UN CLIENTE POR ID
// ============================================
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre_completo, tipo_documento, correo, telefono, celular
       FROM clientes 
       WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /clientes/:id:", err);
    res.status(500).json({ error: "Error al cargar el cliente." });
  }
});

// ============================================
// ➕ CREAR UN NUEVO CLIENTE
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { nombreCompleto, tipoDocumento, correo, telefono, celular } = req.body;

  if (!nombreCompleto) {
    return res.status(400).json({ error: "El nombre completo es obligatorio." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre_completo, tipo_documento, correo, telefono, celular)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre_completo, tipo_documento, correo, telefono, celular`,
      [
        nombreCompleto,
        tipoDocumento || null,
        correo || null,
        telefono || null,
        celular || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /clientes:", err);
    res.status(500).json({ error: "Error al crear el cliente." });
  }
});

// ============================================
// ✏️ ACTUALIZAR UN CLIENTE
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombreCompleto, tipoDocumento, correo, telefono, celular } = req.body;

  if (!nombreCompleto) {
    return res.status(400).json({ error: "El nombre completo es obligatorio." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE clientes 
       SET nombre_completo = $1, 
           tipo_documento = $2, 
           correo = $3, 
           telefono = $4, 
           celular = $5, 
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, nombre_completo, tipo_documento, correo, telefono, celular`,
      [nombreCompleto, tipoDocumento, correo, telefono, celular, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /clientes/:id:", err);
    res.status(500).json({ error: "Error al actualizar el cliente." });
  }
});

// ============================================
// 🗑️ ELIMINAR UN CLIENTE
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM clientes WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }
    res.json({ message: "Cliente eliminado correctamente." });
  } catch (err) {
    console.error("Error en DELETE /clientes/:id:", err);
    res.status(500).json({ error: "Error al eliminar el cliente." });
  }
});

module.exports = router;