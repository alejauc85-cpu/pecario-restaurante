const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// 📥 OBTENER TODAS LAS CUENTAS POR PAGAR
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, descripcion, fecha_ingreso, fecha_pago, valor, estado, factura, cuenta_nro, tipo_cuenta, usuario, created_at
       FROM cuentas_por_pagar 
       ORDER BY fecha_ingreso DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /cuentas-pagar:", err);
    res.status(500).json({ error: "Error al cargar las cuentas por pagar." });
  }
});

// ============================================
// 📥 OBTENER UNA CUENTA POR ID
// ============================================
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, descripcion, fecha_ingreso, fecha_pago, valor, estado, factura, cuenta_nro, tipo_cuenta, usuario
       FROM cuentas_por_pagar 
       WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /cuentas-pagar/:id:", err);
    res.status(500).json({ error: "Error al cargar la cuenta." });
  }
});

// ============================================
// ➕ CREAR UNA NUEVA CUENTA POR PAGAR
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { descripcion, fechaIngreso, fechaPago, valor, estado, factura, cuentaNro, tipoCuenta, usuario } = req.body;

  if (!descripcion || !fechaIngreso || valor == null) {
    return res.status(400).json({ error: "Descripción, fecha de ingreso y valor son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO cuentas_por_pagar (descripcion, fecha_ingreso, fecha_pago, valor, estado, factura, cuenta_nro, tipo_cuenta, usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, descripcion, fecha_ingreso, fecha_pago, valor, estado, factura, cuenta_nro, tipo_cuenta, usuario`,
      [
        descripcion,
        fechaIngreso,
        fechaPago || null,
        valor,
        estado || 'Pendiente',
        factura || null,
        cuentaNro || null,
        tipoCuenta || null,
        usuario || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /cuentas-pagar:", err);
    res.status(500).json({ error: "Error al crear la cuenta por pagar." });
  }
});

// ============================================
// ✏️ ACTUALIZAR UNA CUENTA POR PAGAR
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { descripcion, fechaIngreso, fechaPago, valor, estado, factura, cuentaNro, tipoCuenta, usuario } = req.body;

  if (!descripcion || !fechaIngreso || valor == null) {
    return res.status(400).json({ error: "Descripción, fecha de ingreso y valor son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE cuentas_por_pagar 
       SET descripcion = $1, 
           fecha_ingreso = $2, 
           fecha_pago = $3, 
           valor = $4, 
           estado = $5, 
           factura = $6, 
           cuenta_nro = $7, 
           tipo_cuenta = $8, 
           usuario = $9, 
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, descripcion, fecha_ingreso, fecha_pago, valor, estado, factura, cuenta_nro, tipo_cuenta, usuario`,
      [descripcion, fechaIngreso, fechaPago, valor, estado, factura, cuentaNro, tipoCuenta, usuario, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /cuentas-pagar/:id:", err);
    res.status(500).json({ error: "Error al actualizar la cuenta." });
  }
});

// ============================================
// 🗑️ ELIMINAR UNA CUENTA POR PAGAR
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM cuentas_por_pagar WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }
    res.json({ message: "Cuenta eliminada correctamente." });
  } catch (err) {
    console.error("Error en DELETE /cuentas-pagar/:id:", err);
    res.status(500).json({ error: "Error al eliminar la cuenta." });
  }
});

module.exports = router;