import React, { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, X, Save, User, Calendar, Phone, MapPin, CreditCard, Building, Briefcase,
  AlertCircle, Search, ChevronDown, Eye
} from "lucide-react";
import Swal from "sweetalert2";
import {
  fetchEmpleados, createEmpleado, updateEmpleado, deleteEmpleado,
  fetchVacacionesHistorial, createVacacion, deleteVacacion
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./Empleados.css";

const ITEMS_PER_PAGE = 8;
const TIPOS_CONTRATO = ["Indefinido", "Fijo (1 año)", "Fijo (6 meses)", "Obra o labor", "Aprendizaje"];

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState("Admin");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showVacacionesModal, setShowVacacionesModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [vacacionesHistorial, setVacacionesHistorial] = useState([]);
  const [vacacionesLoading, setVacacionesLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    nombre: "", cedula: "", telefono: "", direccion: "", fecha_nacimiento: "",
    correo: "", numero_cuenta: "", eps: "", pension: "", cesantias: "",
    fecha_inicio: "", tipo_contrato: "", contacto_emergencia: "", parentesco: "", telefono_emergencia: ""
  });

  const [vacacionData, setVacacionData] = useState({ fechaDesde: "", fechaHasta: "" });

  const getToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem("brasa.session") || "{}");
      return session.token || null;
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      return null;
    }
  };

  // Cargar datos
  useEffect(() => {
    cargarEmpleados();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) setUsuario(user.username);
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchEmpleados(token);
      setEmpleados(data);
      setEmpleadosFiltrados(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Filtro
  useEffect(() => {
    let filtered = [...empleados];
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.nombre?.toLowerCase().includes(term) ||
        e.cedula?.includes(term) ||
        e.correo?.toLowerCase().includes(term)
      );
    }
    setEmpleadosFiltrados(filtered);
    setCurrentPage(1);
  }, [empleados, searchTerm]);

  // Manejo de formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCrear = () => {
    setEditingId(null);
    setFormData({ nombre: "", cedula: "", telefono: "", direccion: "", fecha_nacimiento: "", correo: "", numero_cuenta: "", eps: "", pension: "", cesantias: "", fecha_inicio: "", tipo_contrato: "", contacto_emergencia: "", parentesco: "", telefono_emergencia: "" });
    setShowModal(true);
  };

  const handleEditar = (e) => {
    setEditingId(e.id);
    setFormData({ ...e });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    const { nombre, cedula, fecha_inicio } = formData;
    if (!nombre || !cedula || !fecha_inicio) {
      return Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Nombre, cédula y fecha de inicio son obligatorios." });
    }
    const token = getToken();
    try {
      setLoading(true);
      if (editingId) {
        await updateEmpleado(token, editingId, formData);
      } else {
        await createEmpleado(token, formData);
      }
      setShowModal(false);
      await cargarEmpleados();
      Swal.fire({ icon: "success", title: "¡Empleado guardado!", timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (empleado) => {
    const result = await Swal.fire({
      title: "¿Eliminar empleado?",
      text: `"${empleado.nombre}" será eliminado.`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Sí, eliminar"
    });
    if (!result.isConfirmed) return;
    try {
      const token = getToken();
      await deleteEmpleado(token, empleado.id);
      await cargarEmpleados();
      Swal.fire({ icon: "success", title: "Eliminado", timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  // ============================================
  // LÓGICA DE VACACIONES
  // ============================================
  const handleVerVacaciones = async (empleado) => {
    setSelectedEmpleado(empleado);
    setShowVacacionesModal(true);
    setVacacionData({ fechaDesde: "", fechaHasta: "" });
    await cargarVacaciones(empleado.id);
  };

  const cargarVacaciones = async (id) => {
    try {
      setVacacionesLoading(true);
      const token = getToken();
      const data = await fetchVacacionesHistorial(token, id);
      setVacacionesHistorial(data);
    } catch (error) {
      console.error(error);
    } finally {
      setVacacionesLoading(false);
    }
  };

  const handleGuardarVacacion = async () => {
    const { fechaDesde, fechaHasta } = vacacionData;
    if (!fechaDesde || !fechaHasta) {
      return Swal.fire({ icon: "warning", title: "Fechas requeridas", text: "Selecciona las fechas de inicio y fin." });
    }
    try {
      const token = getToken();
      await createVacacion(token, selectedEmpleado.id, { fechaDesde, fechaHasta });
      await cargarVacaciones(selectedEmpleado.id);
      setVacacionData({ fechaDesde: "", fechaHasta: "" });
      Swal.fire({ icon: "success", title: "Vacaciones registradas", timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  const handleEliminarVacacion = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar registro de vacaciones?", icon: "warning",
      showCancelButton: true, confirmButtonText: "Sí, eliminar"
    });
    if (!result.isConfirmed) return;
    try {
      const token = getToken();
      await deleteVacacion(token, selectedEmpleado.id, id);
      await cargarVacaciones(selectedEmpleado.id);
      Swal.fire({ icon: "success", title: "Registro eliminado", timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  const calcularVacacionesAcumuladas = (fechaInicio) => {
    if (!fechaInicio) return 0;
    const start = new Date(fechaInicio);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const diasAcumulados = diffMonths * 1.25; // 15 días al año / 12 meses = 1.25 días/mes
    const tomados = vacacionesHistorial.reduce((sum, v) => sum + v.dias_tomados, 0);
    const pendientes = Math.max(0, diasAcumulados - tomados);
    return { acumulados: Math.round(diasAcumulados * 10) / 10, tomados, pendientes: Math.round(pendientes * 10) / 10 };
  };

  const getPaginatedData = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return empleadosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  };

  const paginatedData = getPaginatedData();

  return (
    <div className="empleados-container">
      <div className="empleados-header">
        <div className="empleados-header-left">
          <h1 className="empleados-title">Empleados</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="empleados-header-right">
          <div className="empleados-usuario"><User size={18} /><span>{usuario}</span></div>
          <button className="btn-crear" onClick={handleCrear} disabled={loading}><Plus size={18} /> Crear empleado</button>
        </div>
      </div>

      <div className="empleados-buscador">
        <input type="text" placeholder="🔍 Buscar por nombre, cédula, correo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm("")}>✕</button>}
      </div>

      <div className="empleados-table-wrapper">
        <table className="empleados-table">
          <thead>
            <tr><th>Nombre</th><th>Cédula</th><th>Teléfono</th><th>Dirección</th><th>Contacto Emergencia</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan="6">No hay empleados registrados</td></tr>
            ) : (
              paginatedData.map(e => (
                <tr key={e.id}>
                  <td>{e.nombre}</td>
                  <td>{e.cedula}</td>
                  <td>{e.telefono || "-"}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{e.direccion || "-"}</td>
                  <td>
                    {e.contacto_emergencia || "-"}
                    {e.telefono_emergencia && <div style={{ fontSize: '0.8rem', color: '#666' }}>{e.telefono_emergencia}</div>}
                  </td>
                  <td>
                    <div className="empleados-acciones">
                      <button className="btn-ver-vacaciones" onClick={() => handleVerVacaciones(e)} disabled={loading} title="Ver vacaciones">
                        <Eye size={16} />
                      </button>
                      <button className="btn-editar" onClick={() => handleEditar(e)} disabled={loading}><Edit size={16} /></button>
                      <button className="btn-eliminar" onClick={() => handleEliminar(e)} disabled={loading}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Paginador totalItems={empleadosFiltrados.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {/* MODAL EMPLEADO */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Editar empleado" : "Crear empleado"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid-3">
                <div className="form-group"><label>Nombre *</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Cédula *</label><input type="text" name="cedula" value={formData.cedula} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Teléfono</label><input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" /></div>
                <div className="form-group full-width"><label>Dirección</label><input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Fecha Nacimiento</label><input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Correo</label><input type="email" name="correo" value={formData.correo} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Número Cuenta</label><input type="text" name="numero_cuenta" value={formData.numero_cuenta} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>EPS</label><input type="text" name="eps" value={formData.eps} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Pensión</label><input type="text" name="pension" value={formData.pension} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Cesantías</label><input type="text" name="cesantias" value={formData.cesantias} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Fecha Inicio *</label><input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Tipo Contrato</label>
                  <select name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange} className="form-input">
                    <option value="">Seleccionar</option>
                    {TIPOS_CONTRATO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Contacto Emergencia</label><input type="text" name="contacto_emergencia" value={formData.contacto_emergencia} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Parentesco</label><input type="text" name="parentesco" value={formData.parentesco} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label>Tel. Emergencia</label><input type="text" name="telefono_emergencia" value={formData.telefono_emergencia} onChange={handleChange} className="form-input" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</button>
              <button className="btn-guardar" onClick={handleGuardar} disabled={loading}><Save size={16} /> Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VACACIONES */}
      {showVacacionesModal && selectedEmpleado && (
        <div className="modal-overlay" onClick={() => !vacacionesLoading && setShowVacacionesModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vacaciones de {selectedEmpleado.nombre}</h2>
              <button className="modal-close" onClick={() => setShowVacacionesModal(false)} disabled={vacacionesLoading}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Formulario para registrar vacaciones */}
              <div className="vacaciones-form">
                <div className="form-group"><label>Fecha desde</label><input type="date" value={vacacionData.fechaDesde} onChange={e => setVacacionData({ ...vacacionData, fechaDesde: e.target.value })} className="form-input" /></div>
                <div className="form-group"><label>Fecha hasta</label><input type="date" value={vacacionData.fechaHasta} onChange={e => setVacacionData({ ...vacacionData, fechaHasta: e.target.value })} className="form-input" /></div>
                <button className="btn-guardar-small" onClick={handleGuardarVacacion} disabled={vacacionesLoading}>Registrar vacaciones</button>
              </div>

              {/* Resumen de vacaciones */}
              <div className="vacaciones-resumen">
                <div><strong>Días acumulados:</strong> {calcularVacacionesAcumuladas(selectedEmpleado.fecha_inicio).acumulados}</div>
                <div><strong>Días tomados:</strong> {calcularVacacionesAcumuladas(selectedEmpleado.fecha_inicio).tomados}</div>
                <div className="pendiente"><strong>Pendientes:</strong> {calcularVacacionesAcumuladas(selectedEmpleado.fecha_inicio).pendientes}</div>
              </div>

              {/* Tabla de historial */}
              <h3 className="historial-title">Historial de vacaciones</h3>
              <div className="vacaciones-table-wrapper">
                <table className="vacaciones-table">
                  <thead><tr><th>Fecha desde</th><th>Fecha hasta</th><th># de días</th><th>Acción</th></tr></thead>
                  <tbody>
                    {vacacionesHistorial.length === 0 ? (
                      <tr><td colSpan="4" className="empty">No hay registros de vacaciones</td></tr>
                    ) : (
                      vacacionesHistorial.map(v => (
                        <tr key={v.id}>
                          <td>{new Date(v.fecha_desde).toLocaleDateString()}</td>
                          <td>{new Date(v.fecha_hasta).toLocaleDateString()}</td>
                          <td>{v.dias_tomados}</td>
                          <td>
                            <button className="btn-eliminar-small" onClick={() => handleEliminarVacacion(v.id)} disabled={vacacionesLoading}>Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setShowVacacionesModal(false)} disabled={vacacionesLoading}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}