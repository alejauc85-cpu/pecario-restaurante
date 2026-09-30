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

// ============================================
// 📥 PRODUCTOS DE UN PROVEEDOR
// GET /api/proveedores/:id/productos
// ============================================
router.get("/:id/productos", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         pp.id,
         pp.producto_id      AS "productoId",
         pp.codigo_proveedor AS "codigoProveedor",
         mi.name             AS "nombre",
         mi.price            AS "precio",
         mi.unit_of_measure  AS "unidadMedida"
       FROM proveedor_productos pp
       INNER JOIN menu_items mi ON mi.id = pp.producto_id
       WHERE pp.proveedor_id = $1
       ORDER BY mi.name ASC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error en GET /proveedores/:id/productos:", err);
    res.status(500).json({ error: "Error al cargar los productos del proveedor." });
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
// ➕ ASOCIAR UN PRODUCTO EXISTENTE A UN PROVEEDOR
// POST /api/proveedores/:id/productos
// Body: { productoId, codigoProveedor? }
// ============================================
router.post("/:id/productos", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { productoId, codigoProveedor } = req.body;

  if (!productoId) {
    return res.status(400).json({ error: "productoId es obligatorio." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO proveedor_productos (proveedor_id, producto_id, codigo_proveedor)
       VALUES ($1, $2, $3)
       ON CONFLICT (proveedor_id, producto_id)
       DO UPDATE SET
         codigo_proveedor = COALESCE(EXCLUDED.codigo_proveedor, proveedor_productos.codigo_proveedor)
       RETURNING
         id,
         producto_id      AS "productoId",
         codigo_proveedor AS "codigoProveedor"`,
      [id, productoId, codigoProveedor || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /proveedores/:id/productos:", err);
    res.status(500).json({ error: "Error al asociar el producto al proveedor." });
  }
});

// ============================================
// 🆕 CREAR UN PRODUCTO NUEVO Y ASOCIARLO AL PROVEEDOR
// POST /api/proveedores/:id/productos/nuevo
// Body: { nombre, codigoProveedor?, precio?, unidadMedida? }
// ============================================
router.post("/:id/productos/nuevo", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, codigoProveedor, precio, unidadMedida } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "El nombre del producto es obligatorio." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: provRows } = await client.query(
      "SELECT id FROM proveedores WHERE id = $1",
      [id]
    );

    if (provRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Proveedor no encontrado." });
    }

    const { rows: existing } = await client.query(
      "SELECT id FROM menu_items WHERE LOWER(name) = LOWER($1) LIMIT 1",
      [nombre]
    );

    let productoId;

    if (existing.length > 0) {
      productoId = existing[0].id;
    } else {
      const { rows: catRows } = await client.query(
        "SELECT id FROM menu_categories ORDER BY id ASC LIMIT 1"
      );

      if (catRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "No hay categorías en el menú. Crea una categoría primero."
        });
      }

      const { rows: newItem } = await client.query(
        `INSERT INTO menu_items (name, price, unit_of_measure, category_id, sort_order)
         VALUES ($1, $2, $3, $4, 0)
         RETURNING id`,
        [nombre, precio || 0, unidadMedida || null, catRows[0].id]
      );
      productoId = newItem[0].id;
    }

    await client.query(
      `INSERT INTO proveedor_productos (proveedor_id, producto_id, codigo_proveedor)
       VALUES ($1, $2, $3)
       ON CONFLICT (proveedor_id, producto_id)
       DO UPDATE SET codigo_proveedor = COALESCE(EXCLUDED.codigo_proveedor, proveedor_productos.codigo_proveedor)`,
      [id, productoId, codigoProveedor || null]
    );

    await client.query("COMMIT");

    res.status(201).json({
      productoId,
      nombre,
      codigoProveedor: codigoProveedor || null,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en POST /proveedores/:id/productos/nuevo:", err);
    res.status(500).json({ error: "Error al crear y asociar el producto." });
  } finally {
    client.release();
  }
});

module.exports = router;