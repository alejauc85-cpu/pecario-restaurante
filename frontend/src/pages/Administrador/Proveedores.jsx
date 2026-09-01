import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  User,
  Building2,
  Phone,
  CreditCard,
  Hash,
  FileText,
  Calendar,
  UserCog,
  Banknote,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  fetchProveedoresList,
  fetchBancos,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./Proveedores.css";

// ============================================
// ⚙️ CONFIGURACIÓN DE PAGINACIÓN
// ============================================
const ITEMS_PER_PAGE = 6;

const TIPOS_CUENTA = [
  { value: "Ahorros", label: "Ahorros" },
  { value: "Corriente", label: "Corriente" },
];

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [bancos, setBancos] = useState([]);
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
    nombreComercial: "",
    nombreCuenta: "",
    descripcion: "",
    telefono: "",
    numeroCuenta: "",
    tipoCuenta: "",
    bancoId: "",
    cedula: "",
    condicionesPago: "",
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
    cargarProveedores();
    cargarBancos();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) {
      setUsuario(user.username);
    }
  }, []);

  // ============================================
  // 🔍 FILTRAR Y PAGINAR
  // ============================================
  useEffect(() => {
    filtrarProveedores();
  }, [proveedores, searchTerm]);

  const filtrarProveedores = () => {
    let filtered = [...proveedores];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.nombreComercial?.toLowerCase().includes(term) ||
          p.nombreCuenta?.toLowerCase().includes(term) ||
          p.descripcion?.toLowerCase().includes(term) ||
          p.telefono?.includes(term) ||
          p.cedula?.includes(term)
      );
    }

    setProveedoresFiltrados(filtered);
    setCurrentPage(1);
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return proveedoresFiltrados.slice(startIndex, endIndex);
  };

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchProveedoresList(token);
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los proveedores",
        confirmButtonColor: "#1a1a2e",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarBancos = async () => {
    try {
      const token = getToken();
      const data = await fetchBancos(token);
      setBancos(data);
    } catch (error) {
      console.error("Error al cargar bancos:", error);
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
      nombreComercial: "",
      nombreCuenta: "",
      descripcion: "",
      telefono: "",
      numeroCuenta: "",
      tipoCuenta: "",
      bancoId: "",
      cedula: "",
      condicionesPago: "",
    });
    setShowModal(true);
  };

  // ============================================
  // ✏️ ABRIR MODAL PARA EDITAR
  // ============================================
  const handleEditar = (proveedor) => {
    setEditingId(proveedor.id);
    setFormData({
      nombreComercial: proveedor.nombreComercial || "",
      nombreCuenta: proveedor.nombreCuenta || "",
      descripcion: proveedor.descripcion || "",
      telefono: proveedor.telefono || "",
      numeroCuenta: proveedor.numeroCuenta || "",
      tipoCuenta: proveedor.tipoCuenta || "",
      bancoId: proveedor.bancoId?.toString() || "",
      cedula: proveedor.cedula || "",
      condicionesPago: proveedor.condicionesPago || "",
    });
    setShowModal(true);
  };

  // ============================================
  // 💾 GUARDAR (CREAR O EDITAR)
  // ============================================
  const handleGuardar = async () => {
    const { nombreComercial } = formData;

    if (!nombreComercial) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "El nombre comercial es obligatorio.",
        confirmButtonColor: "#ef761f",
      });
      return;
    }

    const proveedorData = {
      nombreComercial: formData.nombreComercial,
      nombreCuenta: formData.nombreCuenta || null,
      descripcion: formData.descripcion || null,
      telefono: formData.telefono || null,
      numeroCuenta: formData.numeroCuenta || null,
      tipoCuenta: formData.tipoCuenta || null,
      bancoId: formData.bancoId ? parseInt(formData.bancoId) : null,
      cedula: formData.cedula || null,
      condicionesPago: formData.condicionesPago || null,
    };

    const mensaje = editingId ? "actualizado" : "creado";

    const result = await Swal.fire({
      title: `¿Estás seguro de ${editingId ? "editar" : "crear"} este proveedor?`,
      text: `El proveedor será ${mensaje} en el sistema.`,
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
          response = await updateProveedor(token, editingId, proveedorData);
        } else {
          response = await createProveedor(token, proveedorData);
        }

        setShowModal(false);
        await cargarProveedores();

        Swal.fire({
          icon: "success",
          title: `¡Proveedor ${mensaje} con éxito!`,
          text: `El proveedor ${response.nombreComercial} ha sido ${mensaje}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo guardar el proveedor",
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
  const handleEliminar = async (proveedor) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de eliminar este proveedor?",
      text: `El proveedor "${proveedor.nombreComercial}" será eliminado permanentemente.`,
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
        await deleteProveedor(token, proveedor.id);
        await cargarProveedores();

        Swal.fire({
          icon: "success",
          title: "¡Proveedor eliminado!",
          text: `El proveedor "${proveedor.nombreComercial}" ha sido eliminado.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar el proveedor",
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
    <div className="proveedores-container">
      {/* HEADER */}
      <div className="proveedores-header">
        <div className="proveedores-header-left">
          <h1 className="proveedores-title">Proveedores</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="proveedores-header-right">
          <div className="proveedores-usuario">
            <User size={18} />
            <span>{usuario}</span>
          </div>
          <button className="btn-crear" onClick={handleCrear} disabled={loading}>
            <Plus size={18} />
            Crear proveedor
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="proveedores-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, teléfono..."
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
      <div className="proveedores-table-wrapper">
        <table className="proveedores-table">
          <thead>
            <tr>
              <th>Nombre Comercial</th>
              <th>Descripción</th>
              <th>Teléfono</th>
              <th>Nro Cuenta</th>
              <th>Tipo Cuenta</th>
              <th>Condiciones Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="7" className="proveedores-empty">
                  {searchTerm ? "No hay proveedores que coincidan con la búsqueda" : "No hay proveedores registrados"}
                </td>
              </tr>
            ) : (
              paginatedData.map((proveedor) => (
                <tr key={proveedor.id}>
                  <td>{proveedor.nombreComercial}</td>
                  <td>{proveedor.descripcion || "-"}</td>
                  <td>{proveedor.telefono || "-"}</td>
                  <td>{proveedor.numeroCuenta || "-"}</td>
                  <td>{proveedor.tipoCuenta || "-"}</td>
                  <td>{proveedor.condicionesPago || "-"}</td>
                  <td>
                    <div className="proveedores-acciones">
                      <button
                        className="btn-editar"
                        onClick={() => handleEditar(proveedor)}
                        title="Editar"
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminar(proveedor)}
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
          totalItems={proveedoresFiltrados.length}
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
              <h2>{editingId ? "Editar proveedor" : "Crear nuevo proveedor"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                {/* Nombre Comercial */}
                <div className="form-group">
                  <label>
                    <Building2 size={14} />
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    name="nombreComercial"
                    value={formData.nombreComercial}
                    onChange={handleChange}
                    placeholder="Nombre comercial del proveedor"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Nombre Cuenta (oculto en tabla pero visible en modal) */}
                <div className="form-group">
                  <label>
                    <UserCog size={14} />
                    Nombre Cuenta
                  </label>
                  <input
                    type="text"
                    name="nombreCuenta"
                    value={formData.nombreCuenta}
                    onChange={handleChange}
                    placeholder="Nombre de la cuenta"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Descripción */}
                <div className="form-group form-group-full">
                  <label>
                    <FileText size={14} />
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción del proveedor"
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
                    placeholder="Número de teléfono"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Nro Cuenta */}
                <div className="form-group">
                  <label>
                    <CreditCard size={14} />
                    Nro Cuenta
                  </label>
                  <input
                    type="text"
                    name="numeroCuenta"
                    value={formData.numeroCuenta}
                    onChange={handleChange}
                    placeholder="Número de cuenta"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Tipo Cuenta - SELECT */}
                <div className="form-group">
                  <label>
                    <Hash size={14} />
                    Tipo Cuenta
                  </label>
                  <select
                    name="tipoCuenta"
                    value={formData.tipoCuenta}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar tipo</option>
                    {TIPOS_CUENTA.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Banco - SELECT (oculto en tabla pero visible en modal) */}
                <div className="form-group">
                  <label>
                    <Banknote size={14} />
                    Banco
                  </label>
                  <select
                    name="bancoId"
                    value={formData.bancoId}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar banco</option>
                    {bancos.map((banco) => (
                      <option key={banco.id} value={banco.id}>
                        {banco.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cédula (oculto en tabla pero visible en modal) */}
                <div className="form-group">
                  <label>
                    <Hash size={14} />
                    Cédula
                  </label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    placeholder="Número de cédula"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/* Condiciones de Pago */}
                <div className="form-group">
                  <label>
                    <Calendar size={14} />
                    Condiciones de Pago
                  </label>
                  <input
                    type="text"
                    name="condicionesPago"
                    value={formData.condicionesPago}
                    onChange={handleChange}
                    placeholder="Ej: 30 días, Contado, etc."
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
                {loading ? "Guardando..." : "Guardar proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}