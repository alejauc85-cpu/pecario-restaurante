const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VALID_PAYMENT_METHODS = ["efectivo", "transferencia", "datafono"];

router.post("/", requireAuth, async (req, res) => {
  const { tableNumber, items, propina, total, valorPagado, formaPago } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "La venta debe tener al menos un producto." });
  }
  if (valorPagado == null || Number(valorPagado) <= 0) {
    return res.status(400).json({ error: "El valor pagado es obligatorio." });
  }
  if (!VALID_PAYMENT_METHODS.includes(formaPago)) {
    return res.status(400).json({ error: "Selecciona una forma de pago válida." });
  }
  if (total == null || Number(total) <= 0) {
    return res.status(400).json({ error: "El total de la venta no es válido." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Obtener el último número de factura
    const { rows: lastSale } = await client.query(
      `SELECT numero_factura FROM sales 
       WHERE numero_factura IS NOT NULL 
       ORDER BY id DESC LIMIT 1 
       FOR UPDATE`
    );

    let nextNumber = 1;
    if (lastSale.length > 0 && lastSale[0].numero_factura) {
      const currentNumber = parseInt(lastSale[0].numero_factura.replace('FT', ''), 10);
      nextNumber = currentNumber + 1;
    }

    const nuevoNumeroFactura = `FT${String(nextNumber).padStart(9, '0')}`;

    // 2. Insertar la venta
    const { rows } = await client.query(
      `INSERT INTO sales (table_number, items, propina, total, valor_pagado, forma_pago, created_by, numero_factura)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, table_number, total, created_at, numero_factura`,
      [
        tableNumber ?? null,
        JSON.stringify(items),
        Number(propina) || 0,
        Number(total),
        Number(valorPagado),
        formaPago,
        req.user.username,
        nuevoNumeroFactura,
      ]
    );

    const newSale = rows[0];
    const lowStockItems = [];

    // 3. Descontar inventario y verificar stock bajo
    for (const item of items) {
      if (item.inventory_item_id) {
        await client.query(
          `INSERT INTO inventory_movements 
           (inventory_item_id, quantity, type, reference_id, created_by, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            item.inventory_item_id,
            -(item.qty || item.quantity || 1),
            'sale',
            newSale.id,
            req.user.username,
            `Factura ${nuevoNumeroFactura} - Mesa ${tableNumber || 'N/A'}`
          ]
        );

        const { rows: stockCheck } = await client.query(
          `SELECT id, name, quantity, unit_of_measure as unit, min_stock
           FROM inventory_items 
           WHERE id = $1 AND quantity <= min_stock`,
          [item.inventory_item_id]
        );

        if (stockCheck.length > 0) {
          lowStockItems.push(stockCheck[0]);
        }
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      sale: newSale,
      lowStock: lowStockItems
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en POST /sales:", err);
    res.status(500).json({ error: "Error interno al guardar la venta." });
  } finally {
    client.release();
  }
});

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, table_number, total, forma_pago, created_by, created_at, numero_factura
       FROM sales
       WHERE created_at::date = CURRENT_DATE
       ORDER BY created_at DESC`
    );

    const totalAmount = rows.reduce((sum, r) => sum + r.total, 0);

    res.json({
      count: rows.length,
      totalAmount,
      sales: rows,
    });
  } catch (err) {
    console.error("Error en GET /sales/summary:", err);
    res.status(500).json({ error: "Error interno al cargar el resumen del día." });
  }
});

router.get("/all", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id,
        table_number,
        items,
        propina,
        total,
        valor_pagado,
        forma_pago,
        created_by,
        created_at,
        numero_factura,
        cancelada
       FROM sales
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Error en GET /sales/all:", err);
    res.status(500).json({
      error: "Error interno al cargar las ventas."
    });
  }
});

// ============================================
// 📌 CANCELAR UNA VENTA (Cambia cancelada a true)
// ============================================
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: checkSale } = await pool.query(
      "SELECT id, cancelada FROM sales WHERE id = $1",
      [id]
    );

    if (checkSale.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada." });
    }

    if (checkSale[0].cancelada === true) {
      return res.status(400).json({ error: "Esta venta ya está cancelada." });
    }

    const { rows } = await pool.query(
      `UPDATE sales 
       SET cancelada = true 
       WHERE id = $1 
       RETURNING id, numero_factura, cancelada`,
      [id]
    );

    res.json({ 
      message: "Venta cancelada exitosamente.", 
      sale: rows[0] 
    });
  } catch (err) {
    console.error("Error en PATCH /sales/:id/cancel:", err);
    res.status(500).json({ error: "Error interno al cancelar la venta." });
  }
});

// ============================================
// 📌 OBTENER SOLO VENTAS CANCELADAS
// ============================================
router.get("/canceled", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id,
        numero_factura,
        table_number,
        items,
        total,
        forma_pago,
        created_by,
        created_at,
        cancelada
       FROM sales
       WHERE cancelada = true
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Error en GET /sales/canceled:", err);
    res.status(500).json({ error: "Error interno al cargar ventas canceladas." });
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