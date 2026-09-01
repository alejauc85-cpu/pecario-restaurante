import React, { useEffect, useState } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import {
  fetchMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} from "../api";
import Swal from "sweetalert2";
import Paginador from "../pages/Administrador/Paginador";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Settings,
  Package,
  Ruler,
  DollarSign,
  ChefHat,
} from "lucide-react";
import "./MenuView.css";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const ITEMS_PER_PAGE = 6;

export default function MenuView() {
  const { user, token, logout } = useAuth();

  const [categories, setCategories] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // ============================================================
  // PRODUCTOS
  // ============================================================

  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    pricePlatforms: "",
    unitOfMeasure: "",
    requiresRecipe: true, // Nuevo campo
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);

  // ============================================================
  // CATEGORÍAS
  // ============================================================

  const [showCatModal, setShowCatModal] = useState(false);

  const [catForm, setCatForm] = useState({
    id: "",
    slug: "",
    label: "",
  });

  const [catEditing, setCatEditing] = useState(false);
  const [catPage, setCatPage] = useState(1);

  const allProducts = categories.flatMap((cat) => cat.items || []);

  // ============================================================
  // CARGAR MENÚ
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");

      try {
        const data = await fetchMenu(token);

        if (cancelled) return;

        const loadedCategories = data.categories || [];
        setCategories(loadedCategories);

        if (loadedCategories.length > 0) {
          setActiveId(loadedCategories[0].id);
        } else {
          setActiveId(null);
        }

        setStatus("ready");
      } catch (err) {
        if (cancelled) return;

        console.error("Error cargando menú:", err);
        setError(err.message || "No se pudo cargar el menú.");
        setStatus("error");

        if (/token/i.test(err.message || "")) {
          logout();
        }
      }
    }

    if (token) load();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const activeCategory =
    categories.find((category) => category.id === activeId) || null;

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ============================================================
  // GUARDAR PRODUCTO
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.price) {
      await Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Nombre y precio son obligatorios.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (!activeCategory && !categories[0]) {
      await Swal.fire({
        icon: "warning",
        title: "No hay categoría",
        text: "Debes crear una categoría antes de crear un producto.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);

      const itemData = {
        name: form.name.trim(),
        price: form.price,
        pricePlatforms: form.pricePlatforms || null,
        categoryId: activeCategory?.id || categories[0]?.id,
        unitOfMeasure: form.unitOfMeasure || null,
        requiresRecipe: form.requiresRecipe, // Incluir el nuevo campo
      };

      if (editing) {
        await updateMenuItem(token, form.id, itemData);

        await Swal.fire({
          icon: "success",
          title: "Producto actualizado",
          text: "El producto fue actualizado correctamente.",
          confirmButtonText: "Continuar",
        });
      } else {
        await createMenuItem(token, itemData);

        await Swal.fire({
          icon: "success",
          title: "Producto creado",
          text: form.requiresRecipe
            ? "El producto fue creado correctamente. Recuerda agregarle su receta en la pantalla de Fórmulas."
            : "El producto fue creado correctamente. No requiere fórmula.",
          confirmButtonText: "Continuar",
        });
      }

      setForm({
        id: "",
        name: "",
        price: "",
        pricePlatforms: "",
        unitOfMeasure: "",
        requiresRecipe: true,
      });
      setEditing(false);
      setCurrentPage(1);
      setShowProductModal(false);

      await reloadMenu();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo guardar el producto.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      price: product.price || "",
      pricePlatforms: product.price_platforms ?? product.pricePlatforms ?? "",
      unitOfMeasure: product.unit_of_measure ?? product.unitOfMeasure ?? "",
      requiresRecipe: product.requires_recipe ?? product.requiresRecipe ?? true,
    });

    setEditing(true);
    setShowProductModal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción no se puede deshacer. Si este producto es usado como componente en la receta de otro, no se podrá eliminar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteMenuItem(token, id);
      await reloadMenu();

      await Swal.fire({
        icon: "success",
        title: "Producto eliminado",
        text: "El producto fue eliminado correctamente.",
        confirmButtonText: "Continuar",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err.message || "No se pudo eliminar el producto.",
        confirmButtonText: "Entendido",
      });
    }
  };

  // ============================================================
  // CATEGORÍAS
  // ============================================================

  const handleCatChange = (e) => {
    setCatForm({ ...catForm, [e.target.name]: e.target.value });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    if (!catForm.slug.trim() || !catForm.label.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Slug y Label son obligatorios.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);

      if (catEditing) {
        await updateMenuCategory(token, catForm.id, {
          slug: catForm.slug.trim(),
          label: catForm.label.trim(),
        });

        await Swal.fire({
          icon: "success",
          title: "Categoría actualizada",
          text: "La categoría fue actualizada correctamente.",
          confirmButtonText: "Continuar",
        });
      } else {
        await createMenuCategory(token, {
          slug: catForm.slug.trim(),
          label: catForm.label.trim(),
        });

        await Swal.fire({
          icon: "success",
          title: "Categoría creada",
          text: "La categoría fue creada correctamente.",
          confirmButtonText: "Continuar",
        });
      }

      setCatForm({ id: "", slug: "", label: "" });
      setCatEditing(false);
      await reloadMenu();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo guardar la categoría.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCatEdit = (cat) => {
    setCatForm({ id: cat.id, slug: cat.slug, label: cat.label });
    setCatEditing(true);
  };

  const handleCatDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: "Solo se puede eliminar si no tiene productos asociados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteMenuCategory(token, id);
      await reloadMenu();

      await Swal.fire({
        icon: "success",
        title: "Categoría eliminada",
        text: "La categoría fue eliminada correctamente.",
        confirmButtonText: "Continuar",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err.message || "La categoría no puede eliminarse.",
        confirmButtonText: "Entendido",
      });
    }
  };

  async function reloadMenu() {
    const data = await fetchMenu(token);
    const newCategories = data.categories || [];
    setCategories(newCategories);

    if (activeId && newCategories.some((cat) => cat.id === activeId)) {
      setActiveId(activeId);
    } else {
      setActiveId(newCategories[0]?.id ?? null);
    }
  }

  // ============================================================
  // ESTADOS DE CARGA / ERROR
  // ============================================================

  if (status === "loading") {
    return (
      <div className="menu-view">
        <div className="menu-view-status">Cargando menú…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="menu-view">
        <div className="menu-view-status">
          No se pudo cargar el menú:
          <br />
          {error}
        </div>
      </div>
    );
  }

  // ============================================================
  // VISTA EMPLEADO (NO cambia - sigue igual)
  // ============================================================

  if (user?.role === ROLES.EMPLEADO) {
    return (
      <div className="menu-view">
        <div className="menu-view-tabs">
          {categories.length === 0 ? (
            <div className="menu-empty">No hay categorías disponibles.</div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`menu-view-tab ${activeId === cat.id ? "is-active" : ""}`}
                onClick={() => {
                  setActiveId(cat.id);
                  setCurrentPage(1);
                }}
              >
                {cat.label}
              </button>
            ))
          )}
        </div>

        {activeCategory && (
          <section className="menu-grid-section">
            <header className="menu-grid-header">
              <div>
                <h1>{activeCategory.label}</h1>
                <p>Productos disponibles</p>
              </div>
              <span className="menu-grid-count">
                {activeCategory.items?.length || 0} ítems
              </span>
            </header>

            {activeCategory.items?.length > 0 ? (
              <div className="menu-grid">
                {activeCategory.items.map((item) => (
                  <article className="menu-card" key={item.id}>
                    <div className="menu-card-top">
                      <h2>{item.name}</h2>
                    </div>

                    <div className="menu-price-box">
                      <span className="menu-price-label">Precio</span>
                      <span className="menu-card-price">
                        {currency.format(Number(item.price) || 0)}
                      </span>
                    </div>

                    <div className="menu-platform-box">
                      <span className="menu-price-label">Plataformas</span>
                      <span className="menu-platform-price">
                        {item.price_platforms != null
                          ? currency.format(Number(item.price_platforms) || 0)
                          : "No definido"}
                      </span>
                    </div>

                    {(item.unit_of_measure || item.unitOfMeasure) && (
                      <div className="menu-unit-box">
                        <span className="menu-unit-label">Unidad</span>
                        <span className="menu-unit-value">
                          {item.unit_of_measure || item.unitOfMeasure}
                        </span>
                      </div>
                    )}

                    {item.prep && <p className="menu-card-prep">{item.prep}</p>}
                    {item.note && <p className="menu-card-note">{item.note}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="menu-empty-products">
                <h2>No hay productos</h2>
                <p>Esta categoría todavía no tiene productos registrados.</p>
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  // ============================================================
  // VISTA ADMINISTRADOR (con columna requiresRecipe)
  // ============================================================

  const totalProducts = allProducts.length;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = allProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const catStartIndex = (catPage - 1) * ITEMS_PER_PAGE;
  const paginatedCategories = categories.slice(catStartIndex, catStartIndex + ITEMS_PER_PAGE);

  return (
    <div className="menu-admin-view">
      <h1 className="admin-title">Administrar Menú</h1>

      <div className="admin-actions-bar">
        <button className="btn-manage-categories" onClick={() => setShowCatModal(true)}>
          <Settings size={18} />
          Gestionar Categorías
        </button>

        <button
          className="btn-create-product"
          onClick={() => {
            setEditing(false);
            setForm({
              id: "",
              name: "",
              price: "",
              pricePlatforms: "",
              unitOfMeasure: "",
              requiresRecipe: true,
            });
            setShowProductModal(true);
          }}
        >
          <Plus size={18} />
          Crear Producto
        </button>
      </div>

      <div className="admin-product-section">
        <h2 className="section-subtitle">
          Productos en {activeCategory?.label || "Menú"}
        </h2>

        <div className="admin-table-wrapper">
          <h2>Lista de Productos</h2>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Precio Plataformas</th>
                <th>Unidad</th>
                <th>Requiere Fórmula</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="7">No hay productos registrados.</td>
                </tr>
              ) : (
                paginatedProducts.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{currency.format(Number(item.price) || 0)}</td>
                    <td>
                      {item.price_platforms != null
                        ? currency.format(Number(item.price_platforms) || 0)
                        : "-"}
                    </td>
                    <td>{item.unit_of_measure || "-"}</td>
                    <td>
                      <span className={`badge-requires-recipe ${item.requires_recipe !== false ? 'yes' : 'no'}`}>
                        {item.requires_recipe !== false ? (
                          <>
                            <ChefHat size={12} />
                            Sí
                          </>
                        ) : (
                          "No"
                        )}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-icon"
                        onClick={() => handleEdit(item)}
                        title="Editar producto"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        className="btn-delete-icon"
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Paginador
            totalItems={totalProducts}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* MODAL PRODUCTO */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowProductModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Editar Producto" : "Crear Producto"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowProductModal(false)}
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>ID (Auto)</label>
                    <input type="text" value={form.id} disabled className="input-disabled" />
                  </div>

                  <div className="form-group">
                    <label>
                      <Package size={14} />
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ej: Bandeja Paisa"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <DollarSign size={14} />
                      Precio *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Ej: 38000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <DollarSign size={14} />
                      Precio Plataformas
                    </label>
                    <input
                      type="number"
                      name="pricePlatforms"
                      value={form.pricePlatforms}
                      onChange={handleChange}
                      placeholder="Ej: 42000"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Ruler size={14} />
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      name="unitOfMeasure"
                      value={form.unitOfMeasure}
                      onChange={handleChange}
                      placeholder="Ej: gr, ml, unidad, porción"
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
                      checked={form.requiresRecipe}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <p className="recipe-help" style={{ marginTop: "0.5rem" }}>
                  {form.requiresRecipe
                    ? "La receta/fórmula de este producto se gestiona en la pantalla de Fórmulas."
                    : "Este producto NO aparecerá en la pantalla de Fórmulas."}
                </p>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    <Save size={16} />
                    {loading ? "Guardando..." : editing ? "Actualizar" : "Crear Producto"}
                  </button>

                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditing(false);
                      setForm({
                        id: "",
                        name: "",
                        price: "",
                        pricePlatforms: "",
                        unitOfMeasure: "",
                        requiresRecipe: true,
                      });
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍAS */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowCatModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gestionar Categorías</h2>
              <button
                className="modal-close"
                onClick={() => setShowCatModal(false)}
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="cat-form-container">
                <h3>{catEditing ? "Editar Categoría" : "Nueva Categoría"}</h3>

                <form className="cat-form" onSubmit={handleCategorySubmit}>
                  <input
                    type="text"
                    name="slug"
                    placeholder="Slug (ej: cafeteria)"
                    value={catForm.slug}
                    onChange={handleCatChange}
                    className="form-input"
                    disabled={loading}
                  />

                  <input
                    type="text"
                    name="label"
                    placeholder="Label (ej: Cafetería)"
                    value={catForm.label}
                    onChange={handleCatChange}
                    className="form-input"
                    disabled={loading}
                  />

                  <button type="submit" className="btn-save-small" disabled={loading}>
                    <Save size={14} />
                    {loading ? "Guardando..." : catEditing ? "Actualizar" : "Guardar Categoría"}
                  </button>

                  {catEditing && (
                    <button
                      type="button"
                      className="btn-cancel-small"
                      onClick={() => {
                        setCatEditing(false);
                        setCatForm({ id: "", slug: "", label: "" });
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </form>
              </div>

              <div className="cat-table-wrapper">
                <h3>Categorías existentes</h3>

                <table className="cat-table">
                  <thead>
                    <tr>
                      <th>Slug</th>
                      <th>Label</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3">No hay categorías creadas.</td>
                      </tr>
                    ) : (
                      paginatedCategories.map((cat) => (
                        <tr key={cat.id}>
                          <td>{cat.slug}</td>
                          <td>{cat.label}</td>
                          <td className="actions-cell">
                            <button
                              className="btn-edit-icon"
                              onClick={() => handleCatEdit(cat)}
                              disabled={loading}
                              title="Editar categoría"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              className="btn-delete-icon"
                              onClick={() => handleCatDelete(cat.id)}
                              disabled={loading}
                              title="Eliminar categoría"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <Paginador
                  totalItems={categories.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  currentPage={catPage}
                  onPageChange={setCatPage}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setShowCatModal(false)} disabled={loading}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}