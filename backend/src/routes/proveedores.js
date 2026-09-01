const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// 📥 OBTENER TODOS LOS PROVEEDORES
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        p.id,
        p.nombre_comercial as "nombreComercial",
        p.nombre_cuenta as "nombreCuenta",
        p.descripcion,
        p.telefono,
        p.numero_cuenta as "numeroCuenta",
        p.tipo_cuenta as "tipoCuenta",
        b.id as "bancoId",
        b.nombre as banco,
        p.cedula,
        p.condiciones_pago as "condicionesPago",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM proveedores p
      LEFT JOIN bancos b ON p.banco_id = b.id
      ORDER BY p.nombre_comercial ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /proveedores:", err);
    res.status(500).json({ error: "Error al cargar los proveedores." });
  }
});

// ============================================
// 📥 OBTENER BANCOS (para el select)
// ============================================
router.get("/bancos", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, codigo
       FROM bancos
       WHERE activo = true
       ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /proveedores/bancos:", err);
    res.status(500).json({ error: "Error al cargar los bancos." });
  }
});

// ============================================
// 📥 OBTENER UN PROVEEDOR POR ID
// ============================================
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT 
        p.id,
        p.nombre_comercial as "nombreComercial",
        p.nombre_cuenta as "nombreCuenta",
        p.descripcion,
        p.telefono,
        p.numero_cuenta as "numeroCuenta",
        p.tipo_cuenta as "tipoCuenta",
        b.id as "bancoId",
        b.nombre as banco,
        p.cedula,
        p.condiciones_pago as "condicionesPago",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM proveedores p
      LEFT JOIN bancos b ON p.banco_id = b.id
      WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /proveedores/:id:", err);
    res.status(500).json({ error: "Error al obtener el proveedor." });
  }
});

// ============================================
// 🆕 CREAR UN NUEVO PROVEEDOR
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    nombreComercial,
    nombreCuenta,
    descripcion,
    telefono,
    numeroCuenta,
    tipoCuenta,
    bancoId,
    cedula,
    condicionesPago,
  } = req.body;

  if (!nombreComercial) {
    return res.status(400).json({ 
      error: "El nombre comercial es obligatorio." 
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO proveedores (
        nombre_comercial,
        nombre_cuenta,
        descripcion,
        telefono,
        numero_cuenta,
        tipo_cuenta,
        banco_id,
        cedula,
        condiciones_pago
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        nombre_comercial as "nombreComercial",
        nombre_cuenta as "nombreCuenta",
        descripcion,
        telefono,
        numero_cuenta as "numeroCuenta",
        tipo_cuenta as "tipoCuenta",
        banco_id as "bancoId",
        cedula,
        condiciones_pago as "condicionesPago",
        created_at as "createdAt"`,
      [
        nombreComercial,
        nombreCuenta || null,
        descripcion || null,
        telefono || null,
        numeroCuenta || null,
        tipoCuenta || null,
        bancoId || null,
        cedula || null,
        condicionesPago || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /proveedores:", err);
    res.status(500).json({ error: "Error al crear el proveedor." });
  }
});

// ============================================
// ✏️ ACTUALIZAR UN PROVEEDOR
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    nombreComercial,
    nombreCuenta,
    descripcion,
    telefono,
    numeroCuenta,
    tipoCuenta,
    bancoId,
    cedula,
    condicionesPago,
  } = req.body;

  if (!nombreComercial) {
    return res.status(400).json({ 
      error: "El nombre comercial es obligatorio." 
    });
  }

  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM proveedores WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado." });
    }

    const { rows } = await pool.query(
      `UPDATE proveedores SET
        nombre_comercial = $1,
        nombre_cuenta = $2,
        descripcion = $3,
        telefono = $4,
        numero_cuenta = $5,
        tipo_cuenta = $6,
        banco_id = $7,
        cedula = $8,
        condiciones_pago = $9,
        updated_at = now()
      WHERE id = $10
      RETURNING 
        id,
        nombre_comercial as "nombreComercial",
        nombre_cuenta as "nombreCuenta",
        descripcion,
        telefono,
        numero_cuenta as "numeroCuenta",
        tipo_cuenta as "tipoCuenta",
        banco_id as "bancoId",
        cedula,
        condiciones_pago as "condicionesPago",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [
        nombreComercial,
        nombreCuenta || null,
        descripcion || null,
        telefono || null,
        numeroCuenta || null,
        tipoCuenta || null,
        bancoId || null,
        cedula || null,
        condicionesPago || null,
        id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /proveedores/:id:", err);
    res.status(500).json({ error: "Error al actualizar el proveedor." });
  }
});

// ============================================
// 🗑️ ELIMINAR UN PROVEEDOR
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: existing } = await pool.query(
      "SELECT id, nombre_comercial FROM proveedores WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado." });
    }

    const { rows: pedidos } = await pool.query(
      "SELECT COUNT(*) as count FROM pedidos WHERE proveedor_id = $1",
      [id]
    );

    if (parseInt(pedidos[0].count) > 0) {
      return res.status(400).json({ 
        error: "No se puede eliminar el proveedor porque tiene pedidos asociados.",
        pedidosCount: parseInt(pedidos[0].count)
      });
    }

    await pool.query("DELETE FROM proveedores WHERE id = $1", [id]);

    res.json({ 
      message: "Proveedor eliminado correctamente.",
      proveedor: existing[0]
    });
  } catch (err) {
    console.error("Error en DELETE /proveedores/:id:", err);
    res.status(500).json({ error: "Error al eliminar el proveedor." });
  }
});

// ============================================
// 📊 VENTAS DE LOS ÚLTIMOS 7 DÍAS (para el gráfico)
// ============================================
router.get("/weekly", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        TO_CHAR(created_at, 'Dy') as day_name,
        SUM(total) as total
       FROM sales
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
         AND cancelada = false
       GROUP BY TO_CHAR(created_at, 'Dy')
       ORDER BY MIN(created_at) ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /sales/weekly:", err);
    res.status(500).json({ error: "Error al cargar ventas semanales." });
  }
});

module.exports = router;