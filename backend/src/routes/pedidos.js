const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// 📥 OBTENER TODOS LOS PEDIDOS
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        p.id,
        p.proveedor_id as "proveedorId",
        p.proveedor_nombre as proveedor,
        p.producto,
        p.codigo,
        p.unidad_medida as "unidadMedida",
        p.cantidad,
        p.precio_total as "precioTotal",
        p.precio_unitario as "precioUnitario",
        p.usuario_creacion as "usuarioCreacion",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM pedidos p
      ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /pedidos:", err);
    res.status(500).json({ error: "Error al cargar los pedidos." });
  }
});

// ============================================
// 📥 OBTENER PROVEEDORES (para el select)
// ============================================
router.get("/proveedores", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id,
        nombre_comercial as nombre,
        nombre_cuenta,
        descripcion,
        telefono,
        numero_cuenta,
        tipo_cuenta,
        cedula,
        condiciones_pago
      FROM proveedores
      ORDER BY nombre_comercial ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /pedidos/proveedores:", err);
    res.status(500).json({ error: "Error al cargar los proveedores." });
  }
});

// ============================================
// 📥 OBTENER UN PEDIDO POR ID
// ============================================
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT 
        p.id,
        p.proveedor_id as "proveedorId",
        p.proveedor_nombre as proveedor,
        p.producto,
        p.codigo,
        p.unidad_medida as "unidadMedida",
        p.cantidad,
        p.precio_total as "precioTotal",
        p.precio_unitario as "precioUnitario",
        p.usuario_creacion as "usuarioCreacion",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM pedidos p
      WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /pedidos/:id:", err);
    res.status(500).json({ error: "Error al obtener el pedido." });
  }
});

// ============================================
// 🆕 CREAR UN NUEVO PEDIDO
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    proveedorId,
    proveedor,
    producto,
    codigo,
    unidadMedida,
    cantidad,
    precioTotal,
    precioUnitario,
  } = req.body;

  if (!proveedorId || !producto || !codigo || !unidadMedida || !cantidad || !precioTotal) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios: proveedorId, producto, codigo, unidadMedida, cantidad, precioTotal" 
    });
  }

  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM pedidos WHERE codigo = $1",
      [codigo]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "El código del producto ya existe." });
    }

    const { rows } = await pool.query(
      `INSERT INTO pedidos (
        proveedor_id,
        proveedor_nombre,
        producto,
        codigo,
        unidad_medida,
        cantidad,
        precio_total,
        precio_unitario,
        usuario_creacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        proveedor_id as "proveedorId",
        proveedor_nombre as proveedor,
        producto,
        codigo,
        unidad_medida as "unidadMedida",
        cantidad,
        precio_total as "precioTotal",
        precio_unitario as "precioUnitario",
        usuario_creacion as "usuarioCreacion",
        created_at as "createdAt"`,
      [
        proveedorId,
        proveedor,
        producto,
        codigo,
        unidadMedida,
        parseFloat(cantidad),
        parseFloat(precioTotal),
        parseFloat(precioUnitario) || 0,
        req.user.username,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /pedidos:", err);
    res.status(500).json({ error: "Error al crear el pedido." });
  }
});

// ============================================
// ✏️ ACTUALIZAR UN PEDIDO
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    proveedorId,
    proveedor,
    producto,
    codigo,
    unidadMedida,
    cantidad,
    precioTotal,
    precioUnitario,
  } = req.body;

  if (!proveedorId || !producto || !codigo || !unidadMedida || !cantidad || !precioTotal) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios: proveedorId, producto, codigo, unidadMedida, cantidad, precioTotal" 
    });
  }

  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM pedidos WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    const { rows: codeExists } = await pool.query(
      "SELECT id FROM pedidos WHERE codigo = $1 AND id != $2",
      [codigo, id]
    );

    if (codeExists.length > 0) {
      return res.status(400).json({ error: "El código del producto ya existe." });
    }

    const { rows } = await pool.query(
      `UPDATE pedidos SET
        proveedor_id = $1,
        proveedor_nombre = $2,
        producto = $3,
        codigo = $4,
        unidad_medida = $5,
        cantidad = $6,
        precio_total = $7,
        precio_unitario = $8,
        updated_at = now()
      WHERE id = $9
      RETURNING 
        id,
        proveedor_id as "proveedorId",
        proveedor_nombre as proveedor,
        producto,
        codigo,
        unidad_medida as "unidadMedida",
        cantidad,
        precio_total as "precioTotal",
        precio_unitario as "precioUnitario",
        usuario_creacion as "usuarioCreacion",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [
        proveedorId,
        proveedor,
        producto,
        codigo,
        unidadMedida,
        parseFloat(cantidad),
        parseFloat(precioTotal),
        parseFloat(precioUnitario) || 0,
        id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /pedidos/:id:", err);
    res.status(500).json({ error: "Error al actualizar el pedido." });
  }
});

// ============================================
// 🗑️ ELIMINAR UN PEDIDO
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: existing } = await pool.query(
      "SELECT id, codigo, producto FROM pedidos WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    await pool.query("DELETE FROM pedidos WHERE id = $1", [id]);

    res.json({ 
      message: "Pedido eliminado correctamente.",
      pedido: existing[0]
    });
  } catch (err) {
    console.error("Error en DELETE /pedidos/:id:", err);
    res.status(500).json({ error: "Error al eliminar el pedido." });
  }
});

// ============================================
// 📊 OBTENER RESUMEN DE PEDIDOS
// ============================================
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as "totalPedidos",
        SUM(cantidad) as "totalCantidad",
        SUM(precio_total) as "totalInvertido",
        COUNT(DISTINCT proveedor_id) as "totalProveedores"
      FROM pedidos
      WHERE created_at::date = CURRENT_DATE`
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /pedidos/summary:", err);
    res.status(500).json({ error: "Error al obtener el resumen." });
  }
});

module.exports = router;