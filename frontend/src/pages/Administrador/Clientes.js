import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Mail,
  Phone,
  Hash,
  FileText,
  Smartphone,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  fetchClientesList,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./Clientes.css";

// ============================================
// ⚙️ CONFIGURACIÓN DE PAGINACIÓN
// ============================================
const ITEMS_PER_PAGE = 6;

const TIPOS_DOCUMENTO = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "Pasaporte", label: "Pasaporte" },
];

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
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
    nombreCompleto: "",
    tipoDocumento: "",
    correo: "",
    telefono: "",
    celular: "",
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
    cargarClientes();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) {
      setUsuario(user.username);
    }
  }, []);

  // ============================================
  // 🔍 FILTRAR Y PAGINAR
  // ============================================
  useEffect(() => {
    filtrarClientes();
  }, [clientes, searchTerm]);

  const filtrarClientes = () => {
    let filtered = [...clientes];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.nombreCompleto?.toLowerCase().includes(term) ||
          c.correo?.toLowerCase().includes(term) ||
          c.telefono?.includes(term) ||
          c.celular?.includes(term)
      );
    }

    setClientesFiltrados(filtered);
    setCurrentPage(1);
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return clientesFiltrados.slice(startIndex, endIndex);
  };

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchClientesList(token);
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los clientes",
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
      nombreCompleto: "",
      tipoDocumento: "",
      correo: "",
      telefono: "",
      celular: "",
    });
    setShowModal(true);
  };

  // ============================================
  // ✏️ ABRIR MODAL PARA EDITAR
  // ============================================
  const handleEditar = (cliente) => {
    setEditingId(cliente.id);
    setFormData({
      nombreCompleto: cliente.nombreCompleto || "",
      tipoDocumento: cliente.tipoDocumento || "",
      correo: cliente.correo || "",
      telefono: cliente.telefono || "",
      celular: cliente.celular || "",
    });
    setShowModal(true);
  };

  // ============================================
  // 💾 GUARDAR (CREAR O EDITAR)
  // ============================================
  const handleGuardar = async () => {
    const { nombreCompleto } = formData;

    if (!nombreCompleto) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "El nombre completo es obligatorio.",
        confirmButtonColor: "#ef761f",
      });
      return;
    }

    const clienteData = {
      nombreCompleto: formData.nombreCompleto,
      tipoDocumento: formData.tipoDocumento || null,
      correo: formData.correo || null,
      telefono: formData.telefono || null,
      celular: formData.celular || null,
    };

    const mensaje = editingId ? "actualizado" : "creado";

    const result = await Swal.fire({
      title: `¿Estás seguro de ${editingId ? "editar" : "crear"} este cliente?`,
      text: `El cliente será ${mensaje} en el sistema.`,
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
          response = await updateCliente(token, editingId, clienteData);
        } else {
          response = await createCliente(token, clienteData);
        }

        setShowModal(false);
        await cargarClientes();

        Swal.fire({
          icon: "success",
          title: `¡Cliente ${mensaje} con éxito!`,
          text: `El cliente ${response.nombreCompleto} ha sido ${mensaje}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo guardar el cliente",
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
  const handleEliminar = async (cliente) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de eliminar este cliente?",
      text: `El cliente "${cliente.nombreCompleto}" será eliminado permanentemente.`,
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
        await deleteCliente(token, cliente.id);
        await cargarClientes();

        Swal.fire({
          icon: "success",
          title: "¡Cliente eliminado!",
          text: `El cliente "${cliente.nombreCompleto}" ha sido eliminado.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar el cliente",
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
    <div className="clientes-container">
      {/* HEADER */}
      <div className="clientes-header">
        <div className="clientes-header-left">
          <h1 className="clientes-title">Clientes</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="clientes-header-right">
          <div className="clientes-usuario">
            <User size={18} />
            <span>{usuario}</span>
          </div>
          <button className="btn-crear" onClick={handleCrear} disabled={loading}>
            <Plus size={18} />
            Crear cliente
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="clientes-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, correo, teléfono..."
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
      <div className="clientes-table-wrapper">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Tipo Documento</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Celular</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="clientes-empty">
                  {searchTerm ? "No hay clientes que coincidan con la búsqueda" : "No hay clientes registrados"}
                </td>
              </tr>
            ) : (
              paginatedData.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombreCompleto}</td>
                  <td>{cliente.tipoDocumento || "-"}</td>
                  <td>{cliente.correo || "-"}</td>
                  <td>{cliente.telefono || "-"}</td>
                  <td>{cliente.celular || "-"}</td>
                  <td>
                    <div className="clientes-acciones">
                      <button
                        className="btn-editar"
                        onClick={() => handleEditar(cliente)}
                        title="Editar"
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminar(cliente)}
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
          totalItems={clientesFiltrados.length}
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
              <h2>{editingId ? "Editar cliente" : "Crear nuevo cliente"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                {/* Nombre Completo */}
                <div className="form-group">
                  <label>
                    <User size={14} />
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    placeholder="Nombre completo del cliente"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Tipo de Documento */}
                <div className="form-group">
                  <label>
                    <FileText size={14} />
                    Tipo de Documento
                  </label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar tipo</option>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Correo */}
                <div className="form-group">
                  <label>
                    <Mail size={14} />
                    Correo
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label>
                    <Phone size={14} />
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Número de teléfono fijo"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Celular */}
                <div className="form-group">
                  <label>
                    <Smartphone size={14} />
                    Celular
                  </label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    placeholder="Número de celular"
                    className="form-input"
                    disabled={loading}
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
                {loading ? "Guardando..." : "Guardar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}