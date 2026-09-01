import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Package,
  Ruler,
  Hash,
  DollarSign,
  Tag,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  toggleInventoryStatus,
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./ProductosInventario.css";

// ============================================
// ⚙️ CONFIGURACIÓN DE PAGINACIÓN
// ============================================
const ITEMS_PER_PAGE = 6;

export default function ProductosInventario() {
  const [items, setItems] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState("Admin");

  // ============================================
  // 📄 ESTADO DE PAGINACIÓN Y BÚSQUEDA
  // ============================================
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    unit_of_measure: "Unidad",
    total_price: "",
    quantity: "",
    unit_price: "",
    status: "Activo",
    min_stock: 5,
  });

  // ============================================
  // 📥 OBTENER TOKEN
  // ============================================
  const getToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem("brasa.session") || "{}");
      return session.token || null;
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      return null;
    }
  };

  // ============================================
  // 📥 CARGAR DATOS
  // ============================================
  useEffect(() => {
    cargarItems();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) {
      setUsuario(user.username);
    }
  }, []);

  // ============================================
  // 🔍 FILTRAR Y PAGINAR
  // ============================================
  useEffect(() => {
    filtrarItems();
  }, [items, searchTerm]);

  const filtrarItems = () => {
    let filtered = [...items];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.unit_of_measure?.toLowerCase().includes(term) ||
          item.id?.toString().includes(term)
      );
    }

    setItemsFiltrados(filtered);
    setCurrentPage(1);
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return itemsFiltrados.slice(startIndex, endIndex);
  };

  const cargarItems = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchInventory(token);
      setItems(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los items",
        confirmButtonColor: "#1a1a2e",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✏️ MANEJAR CAMBIOS DEL FORMULARIO
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================
  // 🆕 ABRIR MODAL PARA CREAR
  // ============================================
  const handleCrear = () => {
    setEditingId(null);
    setFormData({
      name: "",
      unit_of_measure: "Unidad",
      total_price: "",
      quantity: "",
      unit_price: "",
      status: "Activo",
      min_stock: 5,
    });
    setShowModal(true);
  };

  // ============================================
  // ✏️ ABRIR MODAL PARA EDITAR
  // ============================================
  const handleEditar = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      unit_of_measure: item.unit_of_measure || "Unidad",
      total_price: item.total_price?.toString() || "",
      quantity: item.quantity?.toString() || "",
      unit_price: item.unit_price?.toString() || "",
      status: item.status || "Activo",
      min_stock: item.min_stock || 5,
    });
    setShowModal(true);
  };

  // ============================================
  // 🔄 CAMBIAR ESTADO (Toggle)
  // ============================================
  const handleToggleEstado = async (item) => {
    try {
      const token = getToken();
      const nuevoEstado = item.status === "Activo" ? "Inactivo" : "Activo";
      
      await toggleInventoryStatus(token, item.id, nuevoEstado);
      await cargarItems();

      Swal.fire({
        icon: "success",
        title: `Item ${nuevoEstado}`,
        text: `El item "${item.name}" ahora está ${nuevoEstado.toLowerCase()}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo cambiar el estado",
        confirmButtonColor: "#1a1a2e",
      });
    }
  };

  // ============================================
  // 💾 GUARDAR (CREAR O EDITAR)
  // ============================================
  const handleGuardar = async () => {
    const { name, unit_of_measure, total_price, quantity, unit_price, status, min_stock } = formData;

    if (!name || !quantity) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Nombre y cantidad son obligatorios.",
        confirmButtonColor: "#ef761f",
      });
      return;
    }

    const itemData = {
      name,
      unit_of_measure: unit_of_measure || "Unidad",
      total_price: parseFloat(total_price) || 0,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unit_price) || 0,
      status: status || "Activo",
      min_stock: parseFloat(min_stock) || 5,
    };

    const mensaje = editingId ? "actualizado" : "creado";

    const result = await Swal.fire({
      title: `¿Estás seguro de ${editingId ? "editar" : "crear"} este item?`,
      text: `El item será ${mensaje} en el sistema.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef761f",
      cancelButtonColor: "#1a1a2e",
      confirmButtonText: `Sí, ${editingId ? "editar" : "crear"}`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = getToken();
        let response;
        if (editingId) {
          response = await updateInventoryItem(token, editingId, itemData);
        } else {
          response = await createInventoryItem(token, itemData);
        }

        setShowModal(false);
        await cargarItems();

        Swal.fire({
          icon: "success",
          title: `¡Item ${mensaje} con éxito!`,
          text: `El item "${response.name}" ha sido ${mensaje}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo guardar el item",
          confirmButtonColor: "#1a1a2e",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ============================================
  // 🗑️ ELIMINAR
  // ============================================
  const handleEliminar = async (item) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de eliminar este item?",
      text: `El item "${item.name}" será eliminado permanentemente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef761f",
      cancelButtonColor: "#1a1a2e",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = getToken();
        await deleteInventoryItem(token, item.id);
        await cargarItems();

        Swal.fire({
          icon: "success",
          title: "¡Item eliminado!",
          text: `El item "${item.name}" ha sido eliminado.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar el item",
          confirmButtonColor: "#1a1a2e",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  const paginatedData = getPaginatedData();

  return (
    <div className="inventario-container">
      {/* HEADER */}
      <div className="inventario-header">
        <div className="inventario-header-left">
          <h1 className="inventario-title">Productos del Inventario</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="inventario-header-right">
          <div className="inventario-usuario">
            <User size={18} />
            <span>{usuario}</span>
          </div>
          <button className="btn-crear" onClick={handleCrear} disabled={loading}>
            <Plus size={18} />
            Crear producto
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="inventario-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, unidad o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="buscador-input"
          disabled={loading}
        />
        {searchTerm && (
          <button
            className="buscador-limpiar"
            onClick={() => setSearchTerm("")}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="inventario-table-wrapper">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Unidad de medida</th>
              <th>Precio total</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="inventario-empty">
                  {searchTerm ? "No hay items que coincidan con la búsqueda" : "No hay items registrados"}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.unit_of_measure || "-"}</td>
                  <td>${item.total_price?.toLocaleString() || 0}</td>
                  <td>{item.quantity || 0}</td>
                  <td>${item.unit_price?.toLocaleString() || 0}</td>
                  <td>
                    {/* TOGGLE SWITCH */}
                    <button
                      className={`toggle-btn ${item.status === "Activo" ? "is-active" : "is-inactive"}`}
                      onClick={() => handleToggleEstado(item)}
                      disabled={loading}
                      title={item.status === "Activo" ? "Desactivar" : "Activar"}
                    >
                      <span className="toggle-track">
                        <span className="toggle-thumb" />
                      </span>
                      <span className="toggle-label">
                        {item.status === "Activo" ? "Activo" : "Inactivo"}
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="inventario-acciones">
                      <button
                        className="btn-editar"
                        onClick={() => handleEditar(item)}
                        title="Editar"
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminar(item)}
                        title="Eliminar"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINADOR */}
        <Paginador
          totalItems={itemsFiltrados.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Editar producto" : "Crear nuevo producto"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                {/* Nombre */}
                <div className="form-group form-group-full">
                  <label>
                    <Package size={14} />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Unidad de medida */}
                <div className="form-group">
                  <label>
                    <Ruler size={14} />
                    Unidad de medida
                  </label>
                  <input
                    type="text"
                    name="unit_of_measure"
                    value={formData.unit_of_measure}
                    onChange={handleChange}
                    placeholder="kg, L, unidad, etc."
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Cantidad */}
                <div className="form-group">
                  <label>
                    <Hash size={14} />
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    className="form-input"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                {/* Precio total */}
                <div className="form-group">
                  <label>
                    <DollarSign size={14} />
                    Precio total
                  </label>
                  <input
                    type="number"
                    name="total_price"
                    value={formData.total_price}
                    onChange={handleChange}
                    placeholder="$0"
                    className="form-input"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                {/* Precio unitario */}
                <div className="form-group">
                  <label>
                    <DollarSign size={14} />
                    Precio unitario
                  </label>
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="$0"
                    className="form-input"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                {/* Stock mínimo */}
                <div className="form-group">
                  <label>
                    <Hash size={14} />
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleChange}
                    placeholder="5"
                    className="form-input"
                    min="0"
                    step="1"
                    disabled={loading}
                  />
                </div>

                {/* Estado */}
                <div className="form-group">
                  <label>
                    <Tag size={14} />
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setShowModal(false)} disabled={loading}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={handleGuardar} disabled={loading}>
                <Save size={16} />
                {loading ? "Guardando..." : "Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}