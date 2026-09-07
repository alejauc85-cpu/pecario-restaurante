import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  User,
  FileText,
  Calendar,
  CreditCard,
  Hash,
  DollarSign,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import {
  fetchCuentasPagar,
  createCuentaPagar,
  updateCuentaPagar,
  deleteCuentaPagar,
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./CuentasPagar.css";

const ITEMS_PER_PAGE = 6;

const ESTADOS = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Pagada", label: "Pagada" },
  { value: "Vencida", label: "Vencida" },
];

const TIPOS_CUENTA = [
  { value: "Ahorros", label: "Ahorros" },
  { value: "Corriente", label: "Corriente" },
];

export default function CuentasPagar() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentasFiltradas, setCuentasFiltradas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState("Admin");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    descripcion: "",
    fechaIngreso: "",
    fechaPago: "",
    valor: "",
    estado: "Pendiente",
    factura: "",
    cuentaNro: "",
    tipoCuenta: "",
    usuario: "",
  });

  // ============================================
  // 🔥 NUEVO: MODAL DE EXPORTAR A EXCEL POR FECHAS
  // ============================================
  const [showExportModal, setShowExportModal] = useState(false);
  const [fechaExportInicio, setFechaExportInicio] = useState("");
  const [fechaExportFin, setFechaExportFin] = useState("");
  const [exporting, setExporting] = useState(false);

  const getToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem("brasa.session") || "{}");
      return session.token || null;
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      return null;
    }
  };

  useEffect(() => {
    cargarCuentas();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) {
      setUsuario(user.username);
    }
  }, []);

  useEffect(() => {
    filtrarCuentas();
  }, [cuentas, searchTerm]);

  const filtrarCuentas = () => {
    let filtered = [...cuentas];
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.descripcion?.toLowerCase().includes(term) ||
          c.factura?.toLowerCase().includes(term) ||
          c.usuario?.toLowerCase().includes(term)
      );
    }
    setCuentasFiltradas(filtered);
    setCurrentPage(1);
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return cuentasFiltradas.slice(startIndex, endIndex);
  };

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchCuentasPagar(token);
      setCuentas(data);
    } catch (error) {
      console.error("Error al cargar cuentas por pagar:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar las cuentas",
        confirmButtonColor: "#1a1a2e",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCrear = () => {
    setEditingId(null);
    setFormData({
      descripcion: "",
      fechaIngreso: "",
      fechaPago: "",
      valor: "",
      estado: "Pendiente",
      factura: "",
      cuentaNro: "",
      tipoCuenta: "",
      usuario: "",
    });
    setShowModal(true);
  };

  const handleEditar = (cuenta) => {
    setEditingId(cuenta.id);
    setFormData({
      descripcion: cuenta.descripcion || "",
      fechaIngreso: cuenta.fecha_ingreso || "",
      fechaPago: cuenta.fecha_pago || "",
      valor: cuenta.valor || "",
      estado: cuenta.estado || "Pendiente",
      factura: cuenta.factura || "",
      cuentaNro: cuenta.cuenta_nro || "",
      tipoCuenta: cuenta.tipo_cuenta || "",
      usuario: cuenta.usuario || "",
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    const { descripcion, fechaIngreso, valor } = formData;

    if (!descripcion || !fechaIngreso || !valor) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Descripción, fecha de ingreso y valor son obligatorios.",
        confirmButtonColor: "#ef761f",
      });
      return;
    }

    const cuentaData = {
      descripcion: formData.descripcion,
      fechaIngreso: formData.fechaIngreso,
      fechaPago: formData.fechaPago || null,
      valor: parseFloat(formData.valor),
      estado: formData.estado || "Pendiente",
      factura: formData.factura || null,
      cuentaNro: formData.cuentaNro || null,
      tipoCuenta: formData.tipoCuenta || null,
      usuario: formData.usuario || null,
    };

    const mensaje = editingId ? "actualizada" : "creada";

    const result = await Swal.fire({
      title: `¿Estás seguro de ${editingId ? "editar" : "crear"} esta cuenta?`,
      text: `La cuenta será ${mensaje} en el sistema.`,
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
          response = await updateCuentaPagar(token, editingId, cuentaData);
        } else {
          response = await createCuentaPagar(token, cuentaData);
        }

        setShowModal(false);
        await cargarCuentas();

        Swal.fire({
          icon: "success",
          title: `¡Cuenta ${mensaje} con éxito!`,
          text: `La cuenta ha sido ${mensaje}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo guardar la cuenta",
          confirmButtonColor: "#1a1a2e",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEliminar = async (cuenta) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de eliminar esta cuenta?",
      text: `"${cuenta.descripcion}" será eliminada permanentemente.`,
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
        await deleteCuentaPagar(token, cuenta.id);
        await cargarCuentas();

        Swal.fire({
          icon: "success",
          title: "¡Cuenta eliminada!",
          text: `La cuenta "${cuenta.descripcion}" ha sido eliminada.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar la cuenta",
          confirmButtonColor: "#1a1a2e",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ============================================
  // 🔥 NUEVO: EXPORTAR A EXCEL POR RANGO DE FECHAS
  //
  // Usa fecha_ingreso para filtrar el rango, y genera
  // el Excel con exactamente las mismas columnas de la tabla.
  // ============================================
  const handleExportarExcel = () => {
    if (!fechaExportInicio || !fechaExportFin) {
      return Swal.fire({
        icon: "warning",
        title: "Fechas requeridas",
        text: "Selecciona la fecha inicio y la fecha fin.",
      });
    }

    if (fechaExportInicio > fechaExportFin) {
      return Swal.fire({
        icon: "warning",
        title: "Rango inválido",
        text: "La fecha inicio debe ser anterior o igual a la fecha fin.",
      });
    }

    try {
      setExporting(true);

      const cuentasRango = cuentas.filter((c) => {
        if (!c.fecha_ingreso) return false;
        const f = c.fecha_ingreso.split("T")[0];
        return f >= fechaExportInicio && f <= fechaExportFin;
      });

      if (cuentasRango.length === 0) {
        setExporting(false);
        return Swal.fire({
          icon: "info",
          title: "Sin datos",
          text: "No hay cuentas por pagar con fecha de ingreso en ese rango.",
        });
      }

      // ---------- Filas con las MISMAS columnas de la tabla ----------
      const filas = cuentasRango.map((c) => ({
        Descripción: c.descripcion || "-",
        "Fecha Ingreso": c.fecha_ingreso
          ? new Date(c.fecha_ingreso).toLocaleDateString()
          : "-",
        "Fecha Pago": c.fecha_pago
          ? new Date(c.fecha_pago).toLocaleDateString()
          : "-",
        Valor: parseFloat(c.valor) || 0,
        Estado: c.estado || "Pendiente",
        Factura: c.factura || "-",
        "Cuenta Nro.": c.cuenta_nro || "-",
        "Tipo Cuenta": c.tipo_cuenta || "-",
        Usuario: c.usuario || "-",
      }));

      const wb = XLSX.utils.book_new();

      const worksheet = XLSX.utils.json_to_sheet(filas, {
        header: [
          "Descripción",
          "Fecha Ingreso",
          "Fecha Pago",
          "Valor",
          "Estado",
          "Factura",
          "Cuenta Nro.",
          "Tipo Cuenta",
          "Usuario",
        ],
      });

      XLSX.utils.book_append_sheet(wb, worksheet, "Cuentas por pagar");

      const nombreArchivo =
        fechaExportInicio === fechaExportFin
          ? `CuentasPorPagar_${fechaExportInicio}.xlsx`
          : `CuentasPorPagar_${fechaExportInicio}_a_${fechaExportFin}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      setShowExportModal(false);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo generar el archivo de Excel.",
      });
    } finally {
      setExporting(false);
    }
  };

  const paginatedData = getPaginatedData();

  return (
    <div className="cuentas-pagar-container">
      <div className="cuentas-pagar-header">
        <div className="cuentas-pagar-header-left">
          <h1 className="cuentas-pagar-title">Cuentas por Pagar</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="cuentas-pagar-header-right">
          <div className="cuentas-pagar-usuario">
            <User size={18} />
            <span>{usuario}</span>
          </div>

          {/* 🔥 NUEVO: BOTÓN EXPORTAR A EXCEL */}
          <button
            className="btn-exportar-excel"
            onClick={() => {
              setFechaExportInicio("");
              setFechaExportFin("");
              setShowExportModal(true);
            }}
            disabled={loading}
          >
            <FileSpreadsheet size={18} />
            Exportar a Excel
          </button>

          <button className="btn-crear" onClick={handleCrear} disabled={loading}>
            <Plus size={18} />
            Crear cuenta
          </button>
        </div>
      </div>

      <div className="cuentas-pagar-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar por descripción, factura, usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="buscador-input"
          disabled={loading}
        />
        {searchTerm && (
          <button
            className="buscador-limpiar"
            onClick={() => setSearchTerm("")}
          >
            ✕
          </button>
        )}
      </div>

      <div className="cuentas-pagar-table-wrapper">
        <table className="cuentas-pagar-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Fecha Ingreso</th>
              <th>Fecha Pago</th>
              <th>Valor</th>
              <th>Estado</th>
              <th>Factura</th>
              <th>Cuenta Nro.</th>
              <th>Tipo Cuenta</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="cuentas-pagar-empty">
                  {searchTerm ? "No hay cuentas que coincidan con la búsqueda" : "No hay cuentas por pagar registradas"}
                </td>
              </tr>
            ) : (
              paginatedData.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td>{cuenta.descripcion}</td>
                  <td>{new Date(cuenta.fecha_ingreso).toLocaleDateString()}</td>
                  <td>{cuenta.fecha_pago ? new Date(cuenta.fecha_pago).toLocaleDateString() : "-"}</td>
                  <td>${parseFloat(cuenta.valor).toLocaleString()}</td>
                  <td>
                    <span className={`estado-badge ${cuenta.estado?.toLowerCase()}`}>
                      {cuenta.estado || "Pendiente"}
                    </span>
                  </td>
                  <td>{cuenta.factura || "-"}</td>
                  <td>{cuenta.cuenta_nro || "-"}</td>
                  <td>{cuenta.tipo_cuenta || "-"}</td>
                  <td>{cuenta.usuario || "-"}</td>
                  <td>
                    <div className="cuentas-pagar-acciones">
                      <button
                        className="btn-editar"
                        onClick={() => handleEditar(cuenta)}
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminar(cuenta)}
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

        <Paginador
          totalItems={cuentasFiltradas.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Editar cuenta" : "Crear nueva cuenta"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={loading}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label><FileText size={14} /> Descripción *</label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción de la cuenta"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label><Calendar size={14} /> Fecha Ingreso *</label>
                  <input
                    type="date"
                    name="fechaIngreso"
                    value={formData.fechaIngreso}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label><Calendar size={14} /> Fecha Pago</label>
                  <input
                    type="date"
                    name="fechaPago"
                    value={formData.fechaPago}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label><DollarSign size={14} /> Valor *</label>
                  <input
                    type="number"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    placeholder="Valor de la cuenta"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label><Hash size={14} /> Estado</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><FileText size={14} /> Factura</label>
                  <input
                    type="text"
                    name="factura"
                    value={formData.factura}
                    onChange={handleChange}
                    placeholder="Número de factura"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label><CreditCard size={14} /> Cuenta Nro.</label>
                  <input
                    type="text"
                    name="cuentaNro"
                    value={formData.cuentaNro}
                    onChange={handleChange}
                    placeholder="Número de cuenta"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label><Hash size={14} /> Tipo Cuenta</label>
                  <select
                    name="tipoCuenta"
                    value={formData.tipoCuenta}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Seleccionar</option>
                    {TIPOS_CUENTA.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><User size={14} /> Usuario</label>
                  <input
                    type="text"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    placeholder="Nombre del usuario"
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
                {loading ? "Guardando..." : "Guardar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          🔥 NUEVO: MODAL DE EXPORTAR A EXCEL POR FECHAS
      ============================================ */}
      {showExportModal && (
        <div
          className="modal-overlay"
          onClick={() => !exporting && setShowExportModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FileSpreadsheet size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Exportar a Excel
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "#666", marginTop: 0 }}>
                Selecciona el rango de <strong>fecha de ingreso</strong> que quieres incluir en el reporte.
              </p>

              <div className="form-group">
                <label><Calendar size={14} /> Fecha inicio</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaExportInicio}
                  onChange={(e) => setFechaExportInicio(e.target.value)}
                  disabled={exporting}
                />
              </div>

              <div className="form-group">
                <label><Calendar size={14} /> Fecha fin</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaExportFin}
                  onChange={(e) => setFechaExportFin(e.target.value)}
                  disabled={exporting}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                Cancelar
              </button>

              <button
                className="btn-guardar"
                onClick={handleExportarExcel}
                disabled={exporting}
              >
                <Download size={16} />
                {exporting ? "Generando..." : "Descargar Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}