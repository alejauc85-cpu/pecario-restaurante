import React, { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, X, Save, User,
  FileText, Calendar, CreditCard, Search, RefreshCw
} from "lucide-react";
import Swal from "sweetalert2";
import { fetchGastos, createGasto, updateGasto, deleteGasto } from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./Gastos.css";

const ITEMS_PER_PAGE = 10;
const FORMAS_PAGO = ["Efectivo", "Transferencia", "Datafono", "Cheque"];

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [gastosFiltrados, setGastosFiltrados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [usuario, setUsuario] = useState("Admin");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({ fechaInicio: "", fechaFin: "" });
  const [formData, setFormData] = useState({
    descripcion: "", fecha: "", valor: "", formaPago: "", usuario: ""
  });

  const getToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem("brasa.session") || "{}");
      return session.token || null;
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      return null;
    }
  };

  const cargarGastos = async (filters = {}) => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchGastos(token, filters);
      setGastos(data);
      setGastosFiltrados(data);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error("Error al cargar gastos:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) setUsuario(user.username);
    cargarGastos({ fechaInicio: new Date().toISOString().split('T')[0] }); // Hoy
  }, []);

  useEffect(() => {
    let filtered = [...gastos];
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(g =>
        g.descripcion?.toLowerCase().includes(term) ||
        g.forma_pago?.toLowerCase().includes(term) ||
        g.usuario?.toLowerCase().includes(term)
      );
    }
    setGastosFiltrados(filtered);
    setCurrentPage(1);
  }, [gastos, searchTerm]);

  const handleConsultar = () => cargarGastos(filtros);

  const getPaginatedData = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return gastosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCrear = () => {
    setEditingId(null);
    setFormData({ descripcion: "", fecha: "", valor: "", formaPago: "", usuario: "" });
    setShowModal(true);
  };

  const handleEditar = (g) => {
    setEditingId(g.id);
    setFormData({
      descripcion: g.descripcion || "",
      fecha: g.fecha || "",
      valor: g.valor || "",
      formaPago: g.forma_pago || "",
      usuario: g.usuario || "",
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    const { descripcion, fecha, valor } = formData;
    if (!descripcion || !fecha || !valor) {
      return Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Descripción, fecha y valor son obligatorios." });
    }
    const data = {
      descripcion: formData.descripcion,
      fecha: formData.fecha,
      valor: parseFloat(formData.valor),
      formaPago: formData.formaPago || null,
      usuario: formData.usuario || null,
    };
    const confirm = await Swal.fire({
      title: `¿${editingId ? "Editar" : "Crear"} gasto?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Sí, ${editingId ? "editar" : "crear"}`,
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      const token = getToken();
      let response;
      if (editingId) {
        response = await updateGasto(token, editingId, data);
      } else {
        response = await createGasto(token, data);
      }
      setShowModal(false);
      await cargarGastos(filtros);
      Swal.fire({ icon: "success", title: "¡Gasto guardado!", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (gasto) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar gasto?",
      text: `"${gasto.descripcion}" será eliminado.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      const token = getToken();
      await deleteGasto(token, gasto.id);
      await cargarGastos(filtros);
      Swal.fire({ icon: "success", title: "Eliminado", timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = getPaginatedData();
  const totalValor = gastosFiltrados.reduce((sum, g) => sum + (g.valor || 0), 0);

  return (
    <div className="gastos-container">
      <div className="gastos-header">
        <div><h1>Consultar Gastos del día</h1>{loading && <span>Cargando...</span>}</div>
        <div className="gastos-header-right">
          <div className="gastos-usuario"><User size={18} /><span>{usuario}</span></div>
          <button className="btn-crear" onClick={handleCrear} disabled={loading}><Plus size={18} /> Crear Gasto</button>
        </div>
      </div>
      {/* Fecha última consulta y total */}
      <div className="gastos-info">
        <span>Fecha última consulta: {lastUpdate || "---"}</span>
        <span>Total: ${totalValor.toLocaleString()}</span>
      </div>

      {/* Filtros y Consulta */}
      <div className="gastos-filtros">
        <div className="gastos-filtro-item">
          <label>Fecha desde</label>
          <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={e => setFiltros({ ...filtros, fechaInicio: e.target.value })} />
        </div>
        <div className="gastos-filtro-item">
          <label>Fecha hasta</label>
          <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={e => setFiltros({ ...filtros, fechaFin: e.target.value })} />
        </div>
        <button className="btn-consultar" onClick={handleConsultar} disabled={loading}>
          <Search size={18} /> Consultar gastos
        </button>
        <button className="btn-refresh" onClick={() => cargarGastos(filtros)} disabled={loading}>
          <RefreshCw size={18} className={loading ? "spin" : ""} /> Recargar
        </button>
      </div>


      {/* Buscador en tabla */}
      <div className="gastos-buscador">
        <input type="text" placeholder="🔍 Buscar por descripción, usuario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm("")}>✕</button>}
      </div>

      {/* Tabla */}
      <div className="gastos-table-wrapper">
        <table className="gastos-table">
          <thead>
            <tr><th>Descripción</th><th>Fecha</th><th>Valor</th><th>Forma de pago</th><th>Usuario</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan="6" className="gastos-empty">No hay gastos que coincidan</td></tr>
            ) : (
              paginatedData.map(g => (
                <tr key={g.id}>
                  <td>{g.descripcion}</td>
                  <td>{new Date(g.fecha).toLocaleDateString()}</td>
                  <td>${parseFloat(g.valor).toLocaleString()}</td>
                  <td>{g.forma_pago || "-"}</td>
                  <td>{g.usuario || "-"}</td>
                  <td>
                    <div className="gastos-acciones">
                      <button className="btn-editar" onClick={() => handleEditar(g)} disabled={loading}><Edit size={16} /></button>
                      <button className="btn-eliminar" onClick={() => handleEliminar(g)} disabled={loading}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Paginador totalItems={gastosFiltrados.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Editar gasto" : "Nuevo gasto"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {/* ✅ AHORA TODOS TIENEN className="form-input" */}
                <div className="form-group">
                  <label><FileText size={14} /> Descripción *</label>
                  <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label><Calendar size={14} /> Fecha *</label>
                  <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Valor *</label>
                  <input type="number" name="valor" value={formData.valor} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label><CreditCard size={14} /> Forma de pago</label>
                  <select name="formaPago" value={formData.formaPago} onChange={handleChange} className="form-input">
                    <option value="">Seleccionar</option>
                    {FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label><User size={14} /> Usuario</label>
                  <input type="text" name="usuario" value={formData.usuario} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</button>
              <button className="btn-guardar" onClick={handleGuardar} disabled={loading}><Save size={16} /> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}