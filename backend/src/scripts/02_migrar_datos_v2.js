// ============================================================
// MIGRAR DATOS (v3): menu_items.recipe_code (JSON) -> recipe_items
// ============================================================
//
// CÓMO DECIDE SI UN ID DEL recipe_code ES "INSUMO" O "COMPONENTE":
//
//   1. Primero busca el id DIRECTO en `inventory_items` (por ID,
//      no por nombre) -> si existe, es un INSUMO real, se conecta
//      directo (inventory_item_id).
//
//   2. Si no está en inventory_items, busca el id en `menu_items`
//      -> si existe, es un COMPONENTE (otro producto del menú
//      usado dentro de esta receta, ej. una Torta dentro de un Combo).
//
//   3. Si no está en ninguna de las dos, se reporta como
//      "realmente faltante" para que lo revises a mano.
//
// Uso:
//   node 02_migrar_datos_v2.js            -> DRY RUN (no guarda nada)
//   node 02_migrar_datos_v2.js --apply    -> aplica los cambios de verdad
// ============================================================

require("dotenv").config(); // carga el .env (index.js lo hace, este script no)
const pool = require("../db/pool"); // ajusta la ruta si es necesario

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "MODO: APLICANDO CAMBIOS" : "MODO: DRY RUN (nada se guarda)");
  console.log("============================================================");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ========================================================
    // 1. Cargar menu_items E inventory_items
    // ========================================================
    const { rows: allItems } = await client.query(
      `SELECT id, name, unit_of_measure, recipe_code FROM menu_items`
    );
    const itemsById = new Map(allItems.map((item) => [item.id, item]));

    const { rows: allInventory } = await client.query(
      `SELECT id, name, unit_of_measure FROM inventory_items`
    );
    // Los ids de recipe_code coinciden directamente con
    // inventory_items.id (confirmado en pgAdmin), así que
    // indexamos por ID, no por nombre.
    const inventoryById = new Map(allInventory.map((inv) => [inv.id, inv]));

    // ========================================================
    // 2. Recorrer recetas y decidir: ¿insumo o componente?
    // ========================================================
    const ambiguousCases = [];
    const trulyMissing = []; // ni en inventory_items ni en menu_items
    let totalRecipeItems = 0;
    let totalInsumos = 0;
    let totalComponentes = 0;

    for (const item of allItems) {
      if (!item.recipe_code) continue;

      let parsed;
      try {
        parsed =
          typeof item.recipe_code === "string"
            ? JSON.parse(item.recipe_code)
            : item.recipe_code;
      } catch {
        ambiguousCases.push({
          producto: item.name,
          motivo: "recipe_code no es JSON válido (parece un código interno)",
          valor: item.recipe_code,
        });
        continue;
      }

      if (!Array.isArray(parsed)) continue;

      for (const ref of parsed) {
        const refId = Number(ref?.id);
        if (!Number.isInteger(refId)) continue;

        const quantity =
          ref.value !== undefined && ref.value !== null && ref.value !== ""
            ? Number(ref.value)
            : null;

        if (quantity === null || Number.isNaN(quantity)) {
          ambiguousCases.push({
            producto: item.name,
            motivo: "value vacío o no numérico",
            valor: JSON.stringify(ref),
          });
          continue;
        }

        // ---- PRIMERO: ¿existe como insumo real en inventory_items? ----
        if (inventoryById.has(refId)) {
          totalRecipeItems++;
          totalInsumos++;
          if (APPLY) {
            await client.query(
              `INSERT INTO recipe_items (menu_item_id, inventory_item_id, quantity)
               VALUES ($1, $2, $3)`,
              [item.id, refId, quantity]
            );
          }
          continue;
        }

        // ---- SI NO: ¿es otro producto del menú (componente)? ----
        const refItem = itemsById.get(refId);
        if (refItem) {
          totalRecipeItems++;
          totalComponentes++;
          if (APPLY) {
            await client.query(
              `INSERT INTO recipe_items (menu_item_id, component_item_id, quantity)
               VALUES ($1, $2, $3)`,
              [item.id, refId, quantity]
            );
          }
          continue;
        }

        // ---- Ni lo uno ni lo otro: de verdad no existe ----
        trulyMissing.push({ producto: item.name, id_faltante: refId });
      }
    }

    // ========================================================
    // 3. Reporte
    // ========================================================
    console.log(`\nFilas de recipe_items ${APPLY ? "creadas" : "a crear"}: ${totalRecipeItems}`);
    console.log(`   - Como insumo (inventory_items): ${totalInsumos}`);
    console.log(`   - Como componente (otro producto del menú): ${totalComponentes}`);

    if (trulyMissing.length > 0) {
      console.log(
        `\n⚠️  IDs que de verdad NO existen ni en inventory_items ni en menu_items (${trulyMissing.length}):`
      );
      trulyMissing.forEach((m) =>
        console.log(`   - "${m.producto}" referencia id=${m.id_faltante} (no encontrado)`)
      );
    } else {
      console.log("\n✅ Todos los ids referenciados se encontraron (insumo o componente).");
    }

    if (ambiguousCases.length > 0) {
      console.log(`\n⚠️  Casos ambiguos / con error (${ambiguousCases.length}):`);
      ambiguousCases.forEach((c) =>
        console.log(`   - "${c.producto}": ${c.motivo} -> ${c.valor}`)
      );
    }

    if (!APPLY) {
      await client.query("ROLLBACK");
      console.log("\n(DRY RUN) No se guardó nada. Corre con --apply para aplicar de verdad.");
    } else {
      await client.query("COMMIT");
      console.log("\n✅ Migración aplicada y guardada.");
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error durante la migración, se revirtió todo:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();