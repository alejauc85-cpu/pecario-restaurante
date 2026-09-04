import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchMenu,
  fetchInventory,
  fetchAllRecipes,
  fetchRecipe,
  saveRecipe,
  deleteRecipe,
  createMenuItem,
} from "../api";
import Swal from "sweetalert2";
import { Plus, Edit, Trash2, X, Save, ChefHat, List } from "lucide-react";
import "./MenuView.css";
import "./Formulaview.css";

export default function FormulaView() {
  const { token } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // Modal de edición de receta
  const [showModal, setShowModal] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [recipeRows, setRecipeRows] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal de productos sin fórmula
  const [showMissingFormulaModal, setShowMissingFormulaModal] = useState(false);

  // Modal de nuevo producto
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: "",
    requiresRecipe: true, // Nuevo campo
  });
  const [newProductRecipeRows, setNewProductRecipeRows] = useState([]);
  const [savingNewProduct, setSavingNewProduct] = useState(false);
  const [categories, setCategories] = useState([]);

  // ============================================================
  // CARGA INICIAL
  // ============================================================
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadAll() {
    setStatus("loading");
    setError("");

    try {
      const [recipesData, menuData, inventoryData] = await Promise.all([
        fetchAllRecipes(token),
        fetchMenu(token),
        fetchInventory(token),
      ]);

      setRecipes(recipesData.recipes || []);

      const flatMenuItems = (menuData.categories || []).flatMap(
        (cat) => cat.items || []
      );
      
      // 🔥 FILTRO: Solo productos que requieren fórmula
      const productsWithRecipe = flatMenuItems.filter(
        (item) => item.requires_recipe !== false // Si no tiene el campo, asumimos que sí requiere
      );
      
      setMenuItems(productsWithRecipe);
      setCategories(menuData.categories || []);

      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);

      setStatus("ready");
    } catch (err) {
      console.error("Error cargando fórmulas:", err);
      setError(err.message || "No se pudo cargar la información.");
      setStatus("error");
    }
  }

  // ============================================================
  // ABRIR MODAL: CREAR / EDITAR RECETA DE UN PRODUCTO
  // ============================================================
  const openEditor = async (menuItemId) => {
    setSelectedMenuItemId(String(menuItemId));
    setShowModal(true);
    setLoadingModal(true);

    try {
      const data = await fetchRecipe(token, menuItemId);

      const rows = (data.items || []).map((item) => ({
        localKey: `${item.id}-${Math.random()}`,
        type: item.inventory_item_id ? "inventory" : "component",
        refId: item.inventory_item_id ?? item.component_item_id,
        quantity: item.quantity,
      }));

      setRecipeRows(rows.length > 0 ? rows : [emptyRow()]);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo cargar la receta de este producto.",
        confirmButtonText: "Entendido",
      });
      setShowModal(false);
    } finally {
      setLoadingModal(false);
    }
  };

  const openCreateForProduct = (menuItemId) => {
    setSelectedMenuItemId(String(menuItemId));
    setRecipeRows([emptyRow()]);
    setShowModal(true);
  };

  function emptyRow() {
    return {
      localKey: `new-${Math.random()}`,
      type: "inventory",
      refId: "",
      quantity: "",
    };
  }

  // ============================================================
  // FILAS DEL FORMULARIO DE EDICIÓN
  // ============================================================
  const addRow = () => setRecipeRows((rows) => [...rows, emptyRow()]);

  const removeRow = (localKey) =>
    setRecipeRows((rows) => rows.filter((r) => r.localKey !== localKey));

  const updateRow = (localKey, field, value) => {
    setRecipeRows((rows) =>
      rows.map((r) =>
        r.localKey === localKey
          ? {
              ...r,
              [field]: value,
              ...(field === "type" ? { refId: "" } : {}),
            }
          : r
      )
    );
  };

  // ============================================================
  // FILAS DEL FORMULARIO DE NUEVO PRODUCTO
  // ============================================================
  const addNewProductRow = () => 
    setNewProductRecipeRows((rows) => [...rows, { ...emptyRow(), localKey: `new-${Math.random()}` }]);

  const removeNewProductRow = (localKey) =>
    setNewProductRecipeRows((rows) => rows.filter((r) => r.localKey !== localKey));

  const updateNewProductRow = (localKey, field, value) => {
    setNewProductRecipeRows((rows) =>
      rows.map((r) =>
        r.localKey === localKey
          ? {
              ...r,
              [field]: value,
              ...(field === "type" ? { refId: "" } : {}),
            }
          : r
      )
    );
  };

  // ============================================================
  // VISTA PREVIA DE FÓRMULA
  // ============================================================
  const getPreviewText = (rows) => {
    return rows
      .filter((r) => r.refId && r.quantity)
      .map((r) => {
        const source = r.type === "inventory" ? inventoryItems : menuItems;
        const found = source.find((i) => String(i.id) === String(r.refId));
        if (!found) return null;
        const unit = found.unit_of_measure || found.unitOfMeasure || "";
        return `${found.name}: ${r.quantity}${unit ? " " + unit : ""}`;
      })
      .filter(Boolean)
      .join(" - ");
  };

  const previewText = getPreviewText(recipeRows);
  const newProductPreviewText = getPreviewText(newProductRecipeRows);

  // ============================================================
  // GUARDAR RECETA (edición)
  // ============================================================
  const handleSaveRecipe = async () => {
    const validRows = recipeRows.filter((r) => r.refId && r.quantity);

    if (validRows.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Receta vacía",
        text: "Agrega al menos un ingrediente con cantidad antes de guardar.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    for (const row of validRows) {
      if (Number(row.quantity) <= 0) {
        await Swal.fire({
          icon: "warning",
          title: "Cantidad inválida",
          text: "Todas las cantidades deben ser mayores a 0.",
          confirmButtonText: "Entendido",
        });
        return;
      }
    }

    try {
      setSaving(true);

      const items = validRows.map((r) => ({
        type: r.type,
        refId: Number(r.refId),
        quantity: Number(r.quantity),
      }));

      await saveRecipe(token, selectedMenuItemId, items);

      await Swal.fire({
        icon: "success",
        title: "Receta guardada",
        text: "La fórmula del producto fue actualizada correctamente.",
        confirmButtonText: "Continuar",
      });

      setShowModal(false);
      await loadAll();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo guardar la receta.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ELIMINAR RECETA
  // ============================================================
  const handleDeleteRecipe = async (menuItemId, name) => {
    const confirm = await Swal.fire({
      title: `¿Eliminar la receta de "${name}"?`,
      text: "Se quitarán todos los ingredientes de este producto. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteRecipe(token, menuItemId);
      await loadAll();

      await Swal.fire({
        icon: "success",
        title: "Receta eliminada",
        text: "La fórmula fue eliminada correctamente.",
        confirmButtonText: "Continuar",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err.message || "No se pudo eliminar la receta.",
        confirmButtonText: "Entendido",
      });
    }
  };

  // ============================================================
  // CREAR NUEVO PRODUCTO CON FÓRMULA
  // ============================================================
  const handleCreateProduct = async () => {
    // Validar datos del producto
    if (!newProductData.name.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "El nombre del producto es obligatorio.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (!newProductData.price || Number(newProductData.price) <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Precio inválido",
        text: "El precio debe ser un número mayor a 0.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (!newProductData.categoryId) {
      await Swal.fire({
        icon: "warning",
        title: "Categoría requerida",
        text: "Debes seleccionar una categoría para el producto.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    // Validar fórmula solo si requiere receta
    let validRows = [];
    if (newProductData.requiresRecipe) {
      validRows = newProductRecipeRows.filter((r) => r.refId && r.quantity);
      
      if (validRows.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Fórmula vacía",
          text: "El producto requiere fórmula. Agrega al menos un ingrediente con cantidad antes de guardar.",
          confirmButtonText: "Entendido",
        });
        return;
      }

      for (const row of validRows) {
        if (Number(row.quantity) <= 0) {
          await Swal.fire({
            icon: "warning",
            title: "Cantidad inválida",
            text: "Todas las cantidades deben ser mayores a 0.",
            confirmButtonText: "Entendido",
          });
          return;
        }
      }
    }

    try {
      setSavingNewProduct(true);

      // 1. Crear el producto con requiresRecipe
      const productData = {
        name: newProductData.name,
        description: newProductData.description || "",
        price: Number(newProductData.price),
        categoryId: Number(newProductData.categoryId),
        image: newProductData.image || "",
        requiresRecipe: newProductData.requiresRecipe,
      };

      const result = await createMenuItem(token, productData);

      // 2. Guardar la fórmula solo si requiere receta
      if (newProductData.requiresRecipe && validRows.length > 0) {
        const items = validRows.map((r) => ({
          type: r.type,
          refId: Number(r.refId),
          quantity: Number(r.quantity),
        }));

        await saveRecipe(token, result.id, items);
      }

      await Swal.fire({
        icon: "success",
        title: "Producto creado",
        text: newProductData.requiresRecipe
          ? `El producto "${newProductData.name}" fue creado con su fórmula exitosamente.`
          : `El producto "${newProductData.name}" fue creado exitosamente (no requiere fórmula).`,
        confirmButtonText: "Continuar",
      });

      setShowNewProductModal(false);
      setNewProductData({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        image: "",
        requiresRecipe: true,
      });
      setNewProductRecipeRows([]);

      await loadAll();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo crear el producto.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setSavingNewProduct(false);
    }
  };

  // ============================================================
  // PRODUCTOS SIN RECETA (solo los que requieren fórmula)
  // ============================================================
  const productsWithRecipe = new Set(recipes.map((r) => r.id));
  const productsWithoutRecipe = menuItems.filter(
    (item) => !productsWithRecipe.has(item.id) && item.requires_recipe !== false
  );

  // ============================================================
  // ESTADOS DE CARGA / ERROR
  // ============================================================
  if (status === "loading") {
    return (
      <div className="menu-view">
        <div className="menu-view-status">Cargando fórmulas…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="menu-view">
        <div className="menu-view-status">
          No se pudo cargar la información:
          <br />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="menu-admin-view formula-view">
      <h1 className="admin-title">
        <ChefHat size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />
        Fórmulas / Recetas
      </h1>
      <p className="section-subtitle" style={{ marginBottom: "1rem" }}>
        Aquí ves cómo se prepara cada producto, ya traducido a texto — nunca
        vas a ver código JSON. Solo tú (admin) puedes ver y editar esta
        pantalla.
      </p>

      {/* ======================================================
          BOTONES DE ACCIÓN (ENCIMA DE LA TABLA)
          ====================================================== */}
      <div className="formula-actions-bar">
        <button
          className="btn-primary"
          onClick={() => setShowMissingFormulaModal(true)}
          disabled={productsWithoutRecipe.length === 0}
        >
          <List size={18} />
          Ver productos sin fórmula ({productsWithoutRecipe.length})
        </button>

        <button
          className="btn-success"
          onClick={() => {
            setNewProductRecipeRows([{ ...emptyRow(), localKey: `new-${Math.random()}` }]);
            setNewProductData({ ...newProductData, requiresRecipe: true });
            setShowNewProductModal(true);
          }}
        >
          <Plus size={18} />
          Crear nuevo producto
        </button>
      </div>

      {/* ======================================================
          TABLA: PRODUCTOS CON RECETA
          ====================================================== */}
      <div className="admin-table-wrapper">
        <h2>Productos con fórmula</h2>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>JSON de la fórmula</th>
              <th>Fórmula legible</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {recipes.length === 0 ? (
              <tr>
                <td colSpan="4">Todavía no hay ninguna receta cargada.</td>
              </tr>
            ) : (
              recipes.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="formula-json-cell">
                    <pre className="formula-json">
                      {JSON.stringify(r.raw || [], null, 2)}
                    </pre>
                  </td>
                  <td className="formula-cell">
                    <span 
                      className="formula-text" 
                      title={r.recipeText || "Sin fórmula"}
                    >
                      {r.recipeText || "-"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit-icon"
                      onClick={() => openEditor(r.id)}
                      title="Editar fórmula"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className="btn-delete-icon"
                      onClick={() => handleDeleteRecipe(r.id, r.name)}
                      title="Eliminar fórmula"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================
          MODAL: PRODUCTOS SIN FÓRMULA
          ====================================================== */}
      {showMissingFormulaModal && (
        <div className="modal-overlay" onClick={() => setShowMissingFormulaModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Productos sin fórmula</h2>
              <button
                className="modal-close"
                onClick={() => setShowMissingFormulaModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {productsWithoutRecipe.length === 0 ? (
                <p>Todos los productos ya tienen fórmula.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsWithoutRecipe.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td className="actions-cell">
                          <button
                            className="btn-create-product"
                            onClick={() => {
                              setShowMissingFormulaModal(false);
                              openCreateForProduct(item.id);
                            }}
                          >
                            <Plus size={16} />
                            Crear fórmula
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL: CREAR NUEVO PRODUCTO
          ====================================================== */}
      {showNewProductModal && (
        <div className="modal-overlay" onClick={() => !savingNewProduct && setShowNewProductModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear nuevo producto</h2>
              <button
                className="modal-close"
                onClick={() => setShowNewProductModal(false)}
                disabled={savingNewProduct}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Datos del producto */}
              <div className="form-group">
                <label>Nombre del producto *</label>
                <input
                  type="text"
                  value={newProductData.name}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, name: e.target.value })
                  }
                  placeholder="Ej: Café con leche"
                  disabled={savingNewProduct}
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={newProductData.description}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, description: e.target.value })
                  }
                  placeholder="Descripción breve del producto"
                  rows="3"
                  disabled={savingNewProduct}
                />
              </div>

              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProductData.price}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, price: e.target.value })
                  }
                  placeholder="Ej: 12.50"
                  disabled={savingNewProduct}
                />
              </div>

              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={newProductData.categoryId}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, categoryId: e.target.value })
                  }
                  disabled={savingNewProduct}
                >
                  <option value="">Selecciona una categoría...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>URL de imagen (opcional)</label>
                <input
                  type="text"
                  value={newProductData.image}
                  onChange={(e) =>
                    setNewProductData({ ...newProductData, image: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                  disabled={savingNewProduct}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <ChefHat size={14} />
                  <span>Este producto requiere fórmula/receta</span>
                </label>
                <input
                  type="checkbox"
                  name="requiresRecipe"
                  checked={newProductData.requiresRecipe}
                  onChange={(e) => {
                    setNewProductData({ 
                      ...newProductData, 
                      requiresRecipe: e.target.checked 
                    });
                    if (!e.target.checked) {
                      setNewProductRecipeRows([]);
                    } else if (newProductRecipeRows.length === 0) {
                      setNewProductRecipeRows([{ ...emptyRow(), localKey: `new-${Math.random()}` }]);
                    }
                  }}
                  disabled={savingNewProduct}
                />
              </div>

              <hr style={{ margin: "1.5rem 0", borderColor: "#e8e0d5" }} />

              {/* Fórmula del nuevo producto - solo si requiere */}
              {newProductData.requiresRecipe && (
                <>
                  <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>
                    Fórmula del producto
                  </h3>

                  {newProductRecipeRows.map((row) => (
                    <div
                      key={row.localKey}
                      className="form-grid"
                      style={{
                        gridTemplateColumns: "1fr 2fr 1fr auto",
                        alignItems: "end",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div className="form-group">
                        <label>Tipo</label>
                        <select
                          value={row.type}
                          onChange={(e) =>
                            updateNewProductRow(row.localKey, "type", e.target.value)
                          }
                          disabled={savingNewProduct}
                        >
                          <option value="inventory">Insumo (inventario)</option>
                          <option value="component">Otro producto del menú</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>
                          {row.type === "inventory" ? "Insumo" : "Producto"}
                        </label>
                        <select
                          value={row.refId}
                          onChange={(e) =>
                            updateNewProductRow(row.localKey, "refId", e.target.value)
                          }
                          disabled={savingNewProduct}
                        >
                          <option value="">Selecciona...</option>
                          {(row.type === "inventory" ? inventoryItems : menuItems)
                            .map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({opt.unit_of_measure || opt.unitOfMeasure || "-"})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Cantidad</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.quantity}
                          onChange={(e) =>
                            updateNewProductRow(row.localKey, "quantity", e.target.value)
                          }
                          placeholder="Ej: 12"
                          disabled={savingNewProduct}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-delete-icon"
                        onClick={() => removeNewProductRow(row.localKey)}
                        title="Quitar esta línea"
                        style={{ marginBottom: "0.4rem" }}
                        disabled={savingNewProduct}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    className="btn-cancel-small" 
                    onClick={addNewProductRow}
                    disabled={savingNewProduct}
                  >
                    <Plus size={14} />
                    Agregar ingrediente
                  </button>

                  {/* VISTA PREVIA DE LA FÓRMULA DEL NUEVO PRODUCTO */}
                  <div className="form-group form-group-full" style={{ marginTop: "1rem" }}>
                    <label>Vista previa de la fórmula</label>
                    <div className="recipe-preview-box">
                      {newProductPreviewText ? (
                        newProductPreviewText.split(" - ").map((part, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="recipe-separator">{" - "}</span>}
                            <span>{part}</span>
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="recipe-preview-empty">
                          Agrega ingredientes para ver la fórmula aquí.
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleCreateProduct}
                  disabled={savingNewProduct}
                >
                  <Save size={16} />
                  {savingNewProduct ? "Creando..." : "Crear producto"}
                </button>

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowNewProductModal(false)}
                  disabled={savingNewProduct}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL: CREAR / EDITAR FÓRMULA
          ====================================================== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Fórmula de:{" "}
                {menuItems.find((m) => String(m.id) === selectedMenuItemId)?.name ||
                  "Producto"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {loadingModal ? (
                <p>Cargando receta actual…</p>
              ) : (
                <>
                  {recipeRows.map((row) => (
                    <div
                      key={row.localKey}
                      className="form-grid"
                      style={{
                        gridTemplateColumns: "1fr 2fr 1fr auto",
                        alignItems: "end",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div className="form-group">
                        <label>Tipo</label>
                        <select
                          value={row.type}
                          onChange={(e) =>
                            updateRow(row.localKey, "type", e.target.value)
                          }
                          disabled={saving}
                        >
                          <option value="inventory">Insumo (inventario)</option>
                          <option value="component">Otro producto del menú</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>
                          {row.type === "inventory" ? "Insumo" : "Producto"}
                        </label>
                        <select
                          value={row.refId}
                          onChange={(e) =>
                            updateRow(row.localKey, "refId", e.target.value)
                          }
                          disabled={saving}
                        >
                          <option value="">Selecciona...</option>
                          {(row.type === "inventory" ? inventoryItems : menuItems)
                            .filter(
                              (opt) =>
                                row.type !== "component" ||
                                String(opt.id) !== selectedMenuItemId
                            )
                            .map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({opt.unit_of_measure || opt.unitOfMeasure || "-"})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Cantidad</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(row.localKey, "quantity", e.target.value)
                          }
                          placeholder="Ej: 12"
                          disabled={saving}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-delete-icon"
                        onClick={() => removeRow(row.localKey)}
                        title="Quitar esta línea"
                        style={{ marginBottom: "0.4rem" }}
                        disabled={saving}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    className="btn-cancel-small" 
                    onClick={addRow}
                    disabled={saving}
                  >
                    <Plus size={14} />
                    Agregar ingrediente
                  </button>

                  <div className="form-group form-group-full" style={{ marginTop: "1rem" }}>
                    <label>Vista previa de la fórmula</label>
                    <div className="recipe-preview-box">
                      {previewText ? (
                        previewText.split(" - ").map((part, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="recipe-separator">{" - "}</span>}
                            <span>{part}</span>
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="recipe-preview-empty">
                          Agrega ingredientes para ver la fórmula aquí.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-save"
                      onClick={handleSaveRecipe}
                      disabled={saving}
                    >
                      <Save size={16} />
                      {saving ? "Guardando..." : "Guardar fórmula"}
                    </button>

                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowModal(false)}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}           