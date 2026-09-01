// backend/routes/inventory.js
const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// OBTENER TODO EL INVENTARIO
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM inventory_items 
       ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /inventory:", err);
    res.status(500).json({ error: "Error al cargar el inventario." });
  }
});

// ============================================
// CREAR NUEVO ITEM DE INVENTARIO
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, unit_of_measure, total_price, quantity, unit_price, min_stock, status } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ error: "Nombre y cantidad son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO inventory_items 
       (name, unit_of_measure, total_price, quantity, unit_price, min_stock, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        unit_of_measure || 'Unidad',
        total_price || 0,
        quantity,
        unit_price || 0,
        min_stock || 5,
        status || 'Activo'
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /inventory:", err);
    res.status(500).json({ error: "Error al crear el item de inventario." });
  }
});

// ============================================
// ACTUALIZAR ITEM DE INVENTARIO
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, unit_of_measure, total_price, quantity, unit_price, min_stock, status } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ error: "Nombre y cantidad son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE inventory_items 
       SET name = $1, unit_of_measure = $2, total_price = $3, 
           quantity = $4, unit_price = $5, min_stock = $6, 
           status = $7, updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [name, unit_of_measure, total_price, quantity, unit_price, min_stock, status, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item de inventario no encontrado." });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /inventory/:id:", err);
    res.status(500).json({ error: "Error al actualizar el item de inventario." });
  }
});

// ============================================
// ELIMINAR ITEM DE INVENTARIO
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el item está siendo usado en el menú
    const { rows: menuItems } = await pool.query(
      "SELECT id, name FROM menu_items WHERE inventory_item_id = $1",
      [id]
    );
    
    if (menuItems.length > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Este item está siendo usado en: ${menuItems.map(i => i.name).join(', ')}`,
        usedInMenu: menuItems
      });
    }

    await pool.query("DELETE FROM inventory_items WHERE id = $1", [id]);
    res.json({ message: "Item eliminado correctamente." });
  } catch (err) {
    console.error("Error en DELETE /inventory/:id:", err);
    res.status(500).json({ error: "Error al eliminar el item de inventario." });
  }
});

// ============================================
// VERIFICAR STOCK BAJO
// ============================================
router.get("/low-stock", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, unit_of_measure, quantity, min_stock,
              CASE 
                WHEN quantity <= min_stock THEN 'critico'
                WHEN quantity <= min_stock * 2 THEN 'bajo'
                ELSE 'normal'
              END as stock_status
       FROM inventory_items 
       WHERE quantity <= min_stock * 2
       ORDER BY quantity ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /inventory/low-stock:", err);
    res.status(500).json({ error: "Error al verificar stock bajo." });
  }
});

// ============================================
// OBTENER MOVIMIENTOS DE INVENTARIO
// ============================================
router.get("/movements", requireAuth, requireAdmin, async (req, res) => {
  const { limit = 50, itemId } = req.query;
  
  try {
    let query = `
      SELECT im.*, ii.name as item_name, ii.unit_of_measure
      FROM inventory_movements im
      JOIN inventory_items ii ON im.inventory_item_id = ii.id
    `;
    const params = [];
    
    if (itemId) {
      query += ` WHERE im.inventory_item_id = $1`;
      params.push(itemId);
    }
    
    query += ` ORDER BY im.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /inventory/movements:", err);
    res.status(500).json({ error: "Error al cargar los movimientos." });
  }
});

// ============================================
// CAMBIAR ESTADO (Activar/Inactivar)
// ============================================
router.patch("/:id/toggle-status", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Verificar si el item existe
    const { rows: existing } = await pool.query(
      "SELECT id, status FROM inventory_items WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Item no encontrado." });
    }

    // Determinar nuevo estado
    const nuevoStatus = status || (existing[0].status === 'Activo' ? 'Inactivo' : 'Activo');

    const { rows } = await pool.query(
      `UPDATE inventory_items SET
        status = $1,
        updated_at = now()
      WHERE id = $2
      RETURNING 
        id,
        name,
        status`,
      [nuevoStatus, id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PATCH /inventory/:id/toggle-status:", err);
    res.status(500).json({ error: "Error al cambiar el estado." });
  }
});

module.exports = router;