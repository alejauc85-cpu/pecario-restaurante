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
  fetchPedidos,
  fetchProveedores,
  createPedido,
  updatePedido,
  deletePedido,
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./IngresarPedidos.css";

// ============================================
// ⚙️ CONFIGURACIÓN DE PAGINACIÓN
// ============================================
const ITEMS_PER_PAGE = 6;

export default function IngresarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState("Admin");

  // ============================================
  // 📄 ESTADO DE PAGINACIÓN
  // ============================================
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    proveedorId: "",
    proveedor: "",
    producto: "",
    codigo: "",
    unidadMedida: "",
    cantidad: "",
    precioTotal: "",
    precioUnitario: "",
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
    cargarPedidos();
    cargarProveedores();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) {
      setUsuario(user.username);
    }
  }, []);

  // ============================================
  // 🔍 FILTRAR Y PAGINAR
  // ============================================
  useEffect(() => {
    filtrarPedidos();
  }, [pedidos, searchTerm]);

  const filtrarPedidos = () => {
    let filtered = [...pedidos];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.proveedor?.toLowerCase().includes(term) ||
          p.producto?.toLowerCase().includes(term) ||
          p.codigo?.toLowerCase().includes(term)
      );
    }

    setPedidosFiltrados(filtered);
    setCurrentPage(1);
  };

  // Obtener pedidos de la página actual
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return pedidosFiltrados.slice(startIndex, endIndex);
  };

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchPedidos(token);
      setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los pedidos",
        confirmButtonColor: "#1a1a2e",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      const token = getToken();
      const data = await fetchProveedores(token);
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  // ============================================
  // ✏️ MANEJAR CAMBIOS DEL FORMULARIO
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "proveedorId") {
      const proveedor = proveedores.find((p) => p.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        proveedorId: value,
        proveedor: proveedor ? proveedor.nombre : "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "precioTotal" || name === "cantidad") {
      const total = name === "precioTotal" ? parseFloat(value) : parseFloat(formData.precioTotal);
      const cantidad = name === "cantidad" ? parseFloat(value) : parseFloat(formData.cantidad);
      if (total && cantidad && cantidad > 0) {
        setFormData((prev) => ({
          ...prev,
          precioUnitario: (total / cantidad).toFixed(2),
        }));
      }
    }
  };

  // ============================================
  // 🆕 ABRIR MODAL PARA CREAR
  // ============================================
  const handleCrear = () => {
    setEditingId(null);
    setFormData({
      proveedorId: "",
      proveedor: "",
      producto: "",
      codigo: "",
      unidadMedida: "",
      cantidad: "",
      precioTotal: "",
      precioUnitario: "",
    });
    setShowModal(true);
  };

  // ============================================
  // ✏️ ABRIR MODAL PARA EDITAR
  // ============================================
  const handleEditar = (pedido) => {
    setEditingId(pedido.id);
    setFormData({
      proveedorId: pedido.proveedorId?.toString() || "",
      proveedor: pedido.proveedor || "",
      producto: pedido.producto,
      codigo: pedido.codigo,
      unidadMedida: pedido.unidadMedida,
      cantidad: pedido.cantidad.toString(),
      precioTotal: pedido.precioTotal.toString(),
      precioUnitario: pedido.precioUnitario?.toString() || "",
    });
    setShowModal(true);
  };

  // ============================================
  // 💾 GUARDAR (CREAR O EDITAR)
  // ============================================
  const handleGuardar = async () => {
    const { proveedorId, proveedor, producto, codigo, unidadMedida, cantidad, precioTotal, precioUnitario } = formData;

    if (!proveedorId || !producto || !codigo || !unidadMedida || !cantidad || !precioTotal) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa todos los campos obligatorios.",
        confirmButtonColor: "#d4a13e",
      });
      return;
    }

    const pedidoData = {
      proveedorId: parseInt(proveedorId),
      proveedor,
      producto,
      codigo,
      unidadMedida,
      cantidad: parseFloat(cantidad),
      precioTotal: parseFloat(precioTotal),
      precioUnitario: parseFloat(precioUnitario) || 0,
    };

    const mensaje = editingId ? "actualizado" : "creado";

    const result = await Swal.fire({
      title: `¿Estás seguro de ${editingId ? "editar" : "crear"} este pedido?`,
      text: `El pedido será ${mensaje} en el sistema.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d4a13e",
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
          response = await updatePedido(token, editingId, pedidoData);
        } else {
          response = await createPedido(token, pedidoData);
        }

        setShowModal(false);
        await cargarPedidos();

        Swal.fire({
          icon: "success",
          title: `¡Pedido ${mensaje} con éxito!`,
          text: `El pedido #${response.codigo} ha sido ${mensaje}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo guardar el pedido",
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
  const handleEliminar = async (pedido) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de eliminar este pedido?",
      text: `El pedido #${pedido.codigo} - ${pedido.producto} será eliminado permanentemente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4a13e",
      cancelButtonColor: "#1a1a2e",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = getToken();
        await deletePedido(token, pedido.id);
        await cargarPedidos();

        Swal.fire({
          icon: "success",
          title: "¡Pedido eliminado!",
          text: `El pedido #${pedido.codigo} ha sido eliminado.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar el pedido",
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
    <div className="ingresar-pedidos-container">
      {/* HEADER */}
      <div className="pedidos-header">
        <div className="pedidos-header-left">
          <h1 className="pedidos-title">Ingresar Pedidos</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="pedidos-header-right">
          <div className="pedidos-usuario">
            <User size={18} />
            <span>{usuario}</span>
          </div>
          <button className="btn-crear" onClick={handleCrear} disabled={loading}>
            <Plus size={18} />
            Crear pedido
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="pedidos-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar por proveedor, producto o código..."
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
      <div className="pedidos-table-wrapper">
        <table className="pedidos-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Producto</th>
              <th>Id</th>
              <th>Unidad de medida</th>
              <th>Cantidad</th>
              <th>Precio total</th>
              <th>Precio unitario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="pedidos-empty">
                  {searchTerm ? "No hay pedidos que coincidan con la búsqueda" : "No hay pedidos registrados"}
                </td>
              </tr>
            ) : (
              paginatedData.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.proveedor}</td>
                  <td>{pedido.producto}</td>
                  <td>{pedido.codigo}</td>
                  <td>{pedido.unidadMedida}</td>
                  <td>{pedido.cantidad}</td>
                  <td>${pedido.precioTotal.toLocaleString()}</td>
                  <td>${pedido.precioUnitario.toLocaleString()}</td>
                  <td>
                    <div className="pedidos-acciones">
                      <button
                        className="btn-editar"
                        onClick={() => handleEditar(pedido)}
                        title="Editar"
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminar(pedido)}
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
          totalItems={pedidosFiltrados.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL (el mismo que tenías) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Editar pedido" : "Crear nuevo pedido"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <Tag size={14} />
                    Proveedor *
                  </label>
                  <select
                    name="proveedorId"
                    value={formData.proveedorId}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <Package size={14} />
                    Producto *
                  </label>
                  <input
                    type="text"
                    name="producto"
                    value={formData.producto}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Hash size={14} />
                    Código *
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    placeholder="Código del producto"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Ruler size={14} />
                    Unidad de medida *
                  </label>
                  <input
                    type="text"
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleChange}
                    placeholder="kg, L, unidad, etc."
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Hash size={14} />
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    placeholder="0"
                    className="form-input"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <DollarSign size={14} />
                    Precio total *
                  </label>
                  <input
                    type="number"
                    name="precioTotal"
                    value={formData.precioTotal}
                    onChange={handleChange}
                    placeholder="$0"
                    className="form-input"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>
                    <DollarSign size={14} />
                    Precio unitario (calculado)
                  </label>
                  <input
                    type="text"
                    name="precioUnitario"
                    value={formData.precioUnitario || "0.00"}
                    className="form-input form-input-disabled"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setShowModal(false)} disabled={loading}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={handleGuardar} disabled={loading}>
                <Save size={16} />
                {loading ? "Guardando..." : "Guardar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}