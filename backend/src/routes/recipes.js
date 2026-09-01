const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================================
// TRAER LA RECETA (fórmula) DE UN PRODUCTO, YA TRADUCIDA
//
// Se genera en el momento, uniendo recipe_items con
// inventory_items (insumos reales) O con menu_items
// (productos usados como componente, ej. Torta dentro de un Combo).
// Nunca se guarda como texto fijo -> nunca se desincroniza.
// ============================================================
router.get("/:menuItemId", requireAuth, requireAdmin, async (req, res) => {
  const { menuItemId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
          ri.id,
          ri.quantity,
          ri.inventory_item_id,
          ri.component_item_id,
          COALESCE(inv.name, comp.name) AS name,
          COALESCE(inv.unit_of_measure, comp.unit_of_measure) AS unit_of_measure
       FROM recipe_items ri
       LEFT JOIN inventory_items inv ON ri.inventory_item_id = inv.id
       LEFT JOIN menu_items comp     ON ri.component_item_id = comp.id
       WHERE ri.menu_item_id = $1
       ORDER BY ri.id ASC`,
      [menuItemId]
    );

    // Texto legible, ej: "Café: 12 gr - Leche: 250 ml"
    const recipeText = rows
      .map((r) => `${r.name}: ${r.quantity}${r.unit_of_measure ? " " + r.unit_of_measure : ""}`)
      .join(" - ");

    res.json({ items: rows, recipeText });
  } catch (err) {
    console.error("Error en GET /recipes/:menuItemId:", err);
    res.status(500).json({ error: "Error al cargar la receta." });
  }
});

// ============================================================
// GUARDAR (REEMPLAZAR) LA RECETA COMPLETA DE UN PRODUCTO
//
// Body esperado:
// {
//   items: [
//     { type: "inventory",  refId: 7,  quantity: 12 },  // insumo real
//     { type: "component",  refId: 70, quantity: 1  }   // otro producto del menú
//   ]
// }
// ============================================================
router.put("/:menuItemId", requireAuth, requireAdmin, async (req, res) => {
  const { menuItemId } = req.params;
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items debe ser un arreglo." });
  }

  for (const item of items) {
    if (!["inventory", "component"].includes(item.type)) {
      return res.status(400).json({
        error: `type inválido: ${item.type}. Debe ser "inventory" o "component".`,
      });
    }
    if (!Number.isInteger(Number(item.refId))) {
      return res.status(400).json({ error: "refId debe ser un número entero." });
    }
    if (Number(item.quantity) <= 0 || Number.isNaN(Number(item.quantity))) {
      return res.status(400).json({ error: "quantity debe ser un número mayor a 0." });
    }
    if (item.type === "component" && Number(item.refId) === Number(menuItemId)) {
      return res.status(400).json({
        error: "Un producto no puede usarse a sí mismo como componente de su propia receta.",
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM recipe_items WHERE menu_item_id = $1`, [
      menuItemId,
    ]);

    for (const item of items) {
      if (item.type === "inventory") {
        await client.query(
          `INSERT INTO recipe_items (menu_item_id, inventory_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [menuItemId, item.refId, item.quantity]
        );
      } else {
        await client.query(
          `INSERT INTO recipe_items (menu_item_id, component_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [menuItemId, item.refId, item.quantity]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Receta actualizada correctamente." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en PUT /recipes/:menuItemId:", err);
    res.status(500).json({ error: "Error al guardar la receta." });
  } finally {
    client.release();
  }
});

// ============================================================
// LISTAR TODAS LAS RECETAS YA TRADUCIDAS (para la vista del
// empleado: "Producto -> Café: 12 gr - Leche: 250 ml", sin JSON)
// ============================================================
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          mi.id,
          mi.name,
          ri.inventory_item_id,
          ri.component_item_id,
          ri.quantity,
          COALESCE(inv.name, comp.name) AS ingredient_name,
          COALESCE(inv.unit_of_measure, comp.unit_of_measure) AS unit_of_measure
       FROM menu_items mi
       JOIN recipe_items ri ON ri.menu_item_id = mi.id
       LEFT JOIN inventory_items inv ON ri.inventory_item_id = inv.id
       LEFT JOIN menu_items comp     ON ri.component_item_id = comp.id
       ORDER BY mi.name ASC, ri.id ASC`
    );

    const byProduct = new Map();

    for (const row of rows) {
      if (!byProduct.has(row.id)) {
        byProduct.set(row.id, { id: row.id, name: row.name, parts: [], raw: [] });
      }

      const entry = byProduct.get(row.id);

      entry.parts.push(
        `${row.ingredient_name}: ${row.quantity}${
          row.unit_of_measure ? " " + row.unit_of_measure : ""
        }`
      );

      // ✅ dato crudo, solo para depuración/verificación en la tabla
      entry.raw.push({
        type: row.inventory_item_id ? "inventory" : "component",
        refId: row.inventory_item_id ?? row.component_item_id,
        quantity: Number(row.quantity),
      });
    }

    const result = Array.from(byProduct.values()).map((p) => ({
      id: p.id,
      name: p.name,
      recipeText: p.parts.join(" - "),
      raw: p.raw, // ✅ arreglo crudo, el frontend lo puede mostrar como JSON
    }));

    res.json({ recipes: result });
  } catch (err) {
    console.error("Error en GET /recipes:", err);
    res.status(500).json({ error: "Error al cargar las recetas." });
  }
});

// ============================================================
// ELIMINAR TODA LA RECETA DE UN PRODUCTO
// ============================================================
router.delete("/:menuItemId", requireAuth, requireAdmin, async (req, res) => {
  const { menuItemId } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM recipe_items WHERE menu_item_id = $1`,
      [menuItemId]
    );

    res.json({ message: `Receta eliminada (${rowCount} ingredientes quitados).` });
  } catch (err) {
    console.error("Error en DELETE /recipes/:menuItemId:", err);
    res.status(500).json({ error: "Error al eliminar la receta." });
  }
});

module.exports = router;