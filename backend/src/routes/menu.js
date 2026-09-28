const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================================
// GENERAR TEXTO DE RECETA DESDE recipe_code
// ============================================================

async function generateRecipeText(recipeCode) {
  if (!recipeCode) {
    return null;
  }

  let recipeItems;

  try {
    recipeItems =
      typeof recipeCode === "string"
        ? JSON.parse(recipeCode)
        : recipeCode;
  } catch (err) {
    console.error("Error parseando recipe_code:", err);
    return null;
  }

  if (!Array.isArray(recipeItems) || recipeItems.length === 0) {
    return null;
  }

  const ids = [
    ...new Set(
      recipeItems
        .map((item) => Number(item?.id))
        .filter((id) => Number.isInteger(id))
    ),
  ];

  if (ids.length === 0) {
    return null;
  }

  const { rows } = await pool.query(
    `SELECT 
        id,
        name,
        unit_of_measure
     FROM menu_items
     WHERE id = ANY($1::int[])`,
    [ids]
  );

  const productsMap = new Map();

  rows.forEach((product) => {
    productsMap.set(Number(product.id), product);
  });

  const recipeParts = [];

  for (const recipeItem of recipeItems) {
    const ingredientId = Number(recipeItem?.id);

    if (!Number.isInteger(ingredientId)) {
      continue;
    }

    const product = productsMap.get(ingredientId);

    if (!product) {
      console.warn(
        `No se encontró el ingrediente con ID ${ingredientId}`
      );
      continue;
    }

    const value =
      recipeItem.value !== undefined &&
      recipeItem.value !== null
        ? String(recipeItem.value).trim()
        : "";

    const unit = product.unit_of_measure
      ? String(product.unit_of_measure).trim()
      : "";

    let text = product.name;

    if (value !== "") {
      text += `: ${value}`;
    }

    if (unit !== "") {
      text += ` ${unit}`;
    }

    recipeParts.push(text);
  }

  if (recipeParts.length === 0) {
    return null;
  }

  return recipeParts.join(" - ");
}

// ============================================================
// CATEGORÍAS — LISTAR TODAS (sin items)
// GET /api/menu/categories
// ============================================================

router.get("/categories", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          id,
          slug,
          label,
          visible_roles,
          sort_order
       FROM menu_categories
       ORDER BY sort_order ASC`
    );

    res.json({ categories: rows });
  } catch (err) {
    console.error("Error en GET /menu/categories:", err);
    res.status(500).json({
      error: "Error al cargar las categorías.",
    });
  }
});

// ============================================================
// CATEGORÍA INDIVIDUAL CON SUS ITEMS
// GET /api/menu/categories/:id
// ============================================================

router.get("/categories/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: categoryRows } = await pool.query(
      `SELECT
          id,
          slug,
          label,
          visible_roles,
          sort_order
       FROM menu_categories
       WHERE id = $1`,
      [id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({
        error: "Categoría no encontrada.",
      });
    }

    const category = categoryRows[0];

    const { rows: items } = await pool.query(
      `SELECT
          id,
          name,
          price,
          price_platforms,
          prep,
          note,
          unit_of_measure,
          recipe_code,
          recipe
       FROM menu_items
       WHERE category_id = $1
       ORDER BY sort_order ASC`,
      [category.id]
    );

    category.items = items;

    res.json(category);
  } catch (err) {
    console.error("Error en GET /menu/categories/:id:", err);
    res.status(500).json({
      error: "Error al cargar la categoría.",
    });
  }
});

// ============================================================
// CREAR CATEGORÍA
// POST /api/menu/categories
// ============================================================

router.post(
  "/categories",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { slug, label, visibleRoles, sortOrder } = req.body;

    if (!slug || !label) {
      return res.status(400).json({
        error: "Slug y label son obligatorios.",
      });
    }

    try {
      const { rows: maxOrder } = await pool.query(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
         FROM menu_categories`
      );

      const { rows } = await pool.query(
        `INSERT INTO menu_categories (
            slug,
            label,
            visible_roles,
            sort_order
         )
         VALUES ($1, $2, $3, $4)
         RETURNING id, slug, label, visible_roles, sort_order`,
        [
          slug,
          label,
          visibleRoles || null,
          sortOrder || maxOrder[0].next_order,
        ]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("Error en POST /menu/categories:", err);
      res.status(500).json({
        error: "Error al crear la categoría.",
      });
    }
  }
);

// ============================================================
// ACTUALIZAR CATEGORÍA
// PUT /api/menu/categories/:id
// ============================================================

router.put(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { slug, label, visibleRoles, sortOrder } = req.body;

    if (!slug || !label) {
      return res.status(400).json({
        error: "Slug y label son obligatorios.",
      });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE menu_categories
         SET
            slug = $1,
            label = $2,
            visible_roles = $3,
            sort_order = COALESCE($4, sort_order)
         WHERE id = $5
         RETURNING id, slug, label, visible_roles, sort_order`,
        [slug, label, visibleRoles || null, sortOrder, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Categoría no encontrada.",
        });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error(
        "Error en PUT /menu/categories/:id:",
        err
      );
      res.status(500).json({
        error: "Error al actualizar la categoría.",
      });
    }
  }
);

// ============================================================
// ELIMINAR CATEGORÍA
// DELETE /api/menu/categories/:id
// ============================================================

router.delete(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const { rowCount } = await pool.query(
        `DELETE FROM menu_categories WHERE id = $1`,
        [id]
      );

      if (rowCount === 0) {
        return res.status(404).json({
          error: "Categoría no encontrada.",
        });
      }

      res.json({
        message: "Categoría eliminada correctamente.",
      });
    } catch (err) {
      console.error(
        "Error en DELETE /menu/categories/:id:",
        err
      );
      res.status(500).json({
        error: "Error al eliminar la categoría.",
      });
    }
  }
);

// ============================================================
// OBTENER MENÚ COMPLETO
// GET /api/menu
// ============================================================

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows: categories } = await pool.query(
      `SELECT 
          id,
          slug,
          label,
          visible_roles
       FROM menu_categories
       ORDER BY sort_order ASC`
    );

    for (const category of categories) {
      const { rows: items } = await pool.query(
        `SELECT
            id,
            name,
            price,
            price_platforms,
            prep,
            note,
            unit_of_measure,
            recipe_code,
            recipe
         FROM menu_items
         WHERE category_id = $1
         ORDER BY sort_order ASC`,
        [category.id]
      );

      category.items = items;
    }

    res.json({
      categories,
    });
  } catch (err) {
    console.error("Error en GET /menu:", err);

    res.status(500).json({
      error: "Error al cargar el menú.",
    });
  }
});

// ============================================================
// CREAR ÍTEM
// POST /api/menu/items
// ============================================================

router.post(
  "/items",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const {
      name,
      price,
      pricePlatforms,
      categoryId,
      unitOfMeasure,
      recipeCode,
    } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        error:
          "Nombre, precio y categoría son obligatorios.",
      });
    }

    try {
      const recipe = await generateRecipeText(recipeCode);

      const { rows: maxOrder } = await pool.query(
        `SELECT 
            COALESCE(MAX(sort_order), 0) + 1 AS next_order
         FROM menu_items
         WHERE category_id = $1`,
        [categoryId]
      );

      const { rows } = await pool.query(
        `INSERT INTO menu_items (
            category_id,
            name,
            price,
            price_platforms,
            sort_order,
            unit_of_measure,
            recipe_code,
            recipe
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING
            id,
            name,
            price,
            price_platforms,
            category_id,
            unit_of_measure,
            recipe_code,
            recipe`,
        [
          categoryId,
          name,
          price,
          pricePlatforms || null,
          maxOrder[0].next_order,
          unitOfMeasure || null,
          recipeCode || null,
          recipe,
        ]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(
        "Error en POST /menu/items:",
        err
      );

      res.status(500).json({
        error: "Error al crear el ítem del menú.",
      });
    }
  }
);

// ============================================================
// ACTUALIZAR ÍTEM
// PUT /api/menu/items/:id
// ============================================================

router.put(
  "/items/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    const {
      name,
      price,
      pricePlatforms,
      categoryId,
      unitOfMeasure,
      recipeCode,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        error: "Nombre y precio son obligatorios.",
      });
    }

    try {
      const recipe = await generateRecipeText(recipeCode);

      const { rows } = await pool.query(
        `UPDATE menu_items
         SET
            name = $1,
            price = $2,
            price_platforms = $3,
            category_id = COALESCE($4, category_id),
            unit_of_measure = $5,
            recipe_code = $6,
            recipe = $7
         WHERE id = $8
         RETURNING
            id,
            name,
            price,
            price_platforms,
            category_id,
            unit_of_measure,
            recipe_code,
            recipe`,
        [
          name,
          price,
          pricePlatforms || null,
          categoryId,
          unitOfMeasure || null,
          recipeCode || null,
          recipe,
          id,
        ]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Ítem no encontrado.",
        });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error(
        "Error en PUT /menu/items/:id:",
        err
      );

      res.status(500).json({
        error: "Error al actualizar el ítem.",
      });
    }
  }
);

// ============================================================
// ELIMINAR ÍTEM
// DELETE /api/menu/items/:id
// ============================================================

router.delete(
  "/items/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const { rowCount } = await pool.query(
        `DELETE FROM menu_items
         WHERE id = $1`,
        [id]
      );

      if (rowCount === 0) {
        return res.status(404).json({
          error: "Ítem no encontrado.",
        });
      }

      res.json({
        message: "Ítem eliminado correctamente.",
      });
    } catch (err) {
      console.error(
        "Error en DELETE /menu/items/:id:",
        err
      );

      res.status(500).json({
        error: "Error al eliminar el ítem.",
      });
    }
  }
);

// ============================================================
// OBTENER ÍTEM ESPECÍFICO
// GET /api/menu/items/:id
// ============================================================

router.get(
  "/items/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const { rows } = await pool.query(
        `SELECT
            id,
            name,
            price,
            price_platforms,
            category_id,
            unit_of_measure,
            recipe_code,
            recipe
         FROM menu_items
         WHERE id = $1`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Ítem no encontrado.",
        });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error(
        "Error en GET /menu/items/:id:",
        err
      );

      res.status(500).json({
        error: "Error al obtener el ítem.",
      });
    }
  }
);

// ============================================================
// CONTEO DE PRODUCTOS
// GET /api/menu/count
// ============================================================

router.get(
  "/count",
  requireAuth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*) AS total
         FROM menu_items`
      );

      res.json(rows[0]);
    } catch (err) {
      console.error(
        "Error en GET /menu/count:",
        err
      );

      res.status(500).json({
        error:
          "Error al contar los productos del menú.",
      });
    }
  }
);

module.exports = router;