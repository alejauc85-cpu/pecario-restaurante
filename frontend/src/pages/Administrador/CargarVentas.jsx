import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  X,
  User,
  Calendar,
  CreditCard,
  FileText,
  Filter,
  ChevronDown,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { fetchAllSales } from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./CargarVentas.css";

const ITEMS_PER_PAGE = 6;

const FORMAS_PAGO = [
  { value: "", label: "Todas" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "datafono", label: "Datafono" },
];

// ✅ Extractores robustos: prueban varias posibles claves para cada campo
const getItemName = (item) =>
  item.name || item.nombre || item.producto || item.descripcion || "--";

const getItemQty = (item) => {
  const raw = item.qty ?? item.quantity ?? item.cantidad;
  return raw === undefined || raw === null || raw === "" ? 1 : raw;
};

const getItemPrice = (item) => {
  const raw = item.price ?? item.valor ?? item.precio ?? item.importe ?? 0;
  const num = typeof raw === "string" ? parseFloat(raw.replace(/[^\d.-]/g, "")) : raw;
  return isNaN(num) ? 0 : num;
};

// ✅ Parseo robusto del JSON de items (misma lógica que usa la tabla)
const parseItemsVenta = (venta) => {
  if (!venta.items) return [];
  try {
    const parsed =
      typeof venta.items === "string" ? JSON.parse(venta.items) : venta.items;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error("Error parseando items:", e);
    return [];
  }
};

const getMesaLabel = (venta) =>
  venta.table_number === 1 ||
  venta.table_number === 2 ||
  venta.table_number === 3 ||
  venta.table_number === 4
    ? `Mesa ${venta.table_number}`
    : "Caja";

export default function CargarVentas() {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState("Admin");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [filtros, setFiltros] = useState({
    factura: "",
    mesa: "",
    formaPago: "",
    fechaInicio: "",
    fechaFin: "",
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

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const filtrosAPI = {};
      if (filtros.factura) filtrosAPI.factura = filtros.factura;
      if (filtros.mesa) filtrosAPI.mesa = filtros.mesa;
      if (filtros.formaPago) filtrosAPI.formaPago = filtros.formaPago;
      if (filtros.fechaInicio) filtrosAPI.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) filtrosAPI.fechaFin = filtros.fechaFin;

      const data = await fetchAllSales(token, filtrosAPI);
      setVentas(data);
      setUltimaActualizacion(new Date().toLocaleString());

      Swal.fire({
        icon: "success",
        title: "Ventas cargadas",
        text: `Se encontraron ${data.length} ventas.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar las ventas",
        confirmButtonColor: "#1a1a2e",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ventas.length === 0) return;

    let filtered = [...ventas];

    // 🔥 FILTRO PRINCIPAL: Excluir las ventas que ya están canceladas
    // 👇 Esta línea es la CLAVE: solo dejamos las que NO están canceladas
    filtered = filtered.filter((v) => v.cancelada !== true);

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (v) =>
          v.numero_factura?.toString().includes(term) ||
          v.table_number?.toString().includes(term) ||
          v.created_by?.toLowerCase().includes(term) ||
          v.forma_pago?.toLowerCase().includes(term) ||
          (v.items && JSON.stringify(v.items).toLowerCase().includes(term))
      );
    }

    setVentasFiltradas(filtered);
    setCurrentPage(1);
  }, [ventas, searchTerm]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.username) {
      setUsuario(user.username);
    }
    cargarVentas();
  }, []);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return ventasFiltradas.slice(startIndex, endIndex);
  };

  const limpiarFiltros = () => {
    setFiltros({
      factura: "",
      mesa: "",
      formaPago: "",
      fechaInicio: "",
      fechaFin: "",
    });
    setSearchTerm("");
  };

  const aplicarFiltrosYRecargar = () => {
    cargarVentas();
    setMostrarFiltros(false);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================
  // 🔥 NUEVO: EXPORTAR A EXCEL POR RANGO DE FECHAS
  //
  // Usa la MISMA estructura de la tabla: una fila por
  // producto, con Factura/Fecha/Mesa/Forma de pago/Usuario/
  // Cancelada repetidos en cada fila (Excel no tiene rowSpan).
  // ============================================
  const handleExportarExcel = async () => {
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
      const token = getToken();

      // Traemos todas las ventas del rango directamente vía filtros de la API
      const data = await fetchAllSales(token, {
        fechaInicio: fechaExportInicio,
        fechaFin: fechaExportFin,
      });

      const ventasRango = (data || []).filter((v) => v.cancelada !== true);

      if (ventasRango.length === 0) {
        setExporting(false);
        return Swal.fire({
          icon: "info",
          title: "Sin datos",
          text: "No hay ventas registradas en ese rango de fechas.",
        });
      }

      // ---------- Construir filas igual que la tabla (1 fila por producto) ----------
      const filas = [];

      ventasRango.forEach((venta) => {
        let fechaMostrar = "--";
        if (venta.created_at) {
          const fechaObj = new Date(venta.created_at);
          if (!isNaN(fechaObj.getTime())) {
            fechaMostrar = fechaObj.toLocaleDateString();
          }
        }

        const itemsVenta = parseItemsVenta(venta);
        const mesaLabel = getMesaLabel(venta);

        if (itemsVenta.length === 0) {
          filas.push({
            Factura: venta.numero_factura || "--",
            Fecha: fechaMostrar,
            Producto: "--",
            Cantidad: "--",
            Valor: Number(venta.total || 0),
            Mesa: mesaLabel,
            "Forma de pago": venta.forma_pago || "--",
            Usuario: venta.created_by || "--",
            Cancelada: venta.cancelada === true ? "SÍ" : "NO",
          });
          return;
        }

        itemsVenta.forEach((item) => {
          filas.push({
            Factura: venta.numero_factura || "--",
            Fecha: fechaMostrar,
            Producto: getItemName(item),
            Cantidad: getItemQty(item),
            Valor: getItemPrice(item),
            Mesa: mesaLabel,
            "Forma de pago": venta.forma_pago || "--",
            Usuario: venta.created_by || "--",
            Cancelada: venta.cancelada === true ? "SÍ" : "NO",
          });
        });
      });

      // ---------- Armar el libro de Excel (una sola hoja, mismas columnas de la tabla) ----------
      const wb = XLSX.utils.book_new();

      const worksheet = XLSX.utils.json_to_sheet(filas, {
        header: [
          "Factura",
          "Fecha",
          "Producto",
          "Cantidad",
          "Valor",
          "Mesa",
          "Forma de pago",
          "Usuario",
          "Cancelada",
        ],
      });

      XLSX.utils.book_append_sheet(wb, worksheet, "Ventas");

      const nombreArchivo =
        fechaExportInicio === fechaExportFin
          ? `Ventas_${fechaExportInicio}.xlsx`
          : `Ventas_${fechaExportInicio}_a_${fechaExportFin}.xlsx`;

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

  const totalVentas = ventasFiltradas.length;
  const totalValor = ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0);

  return (
    <div className="ventas-container">
      {/* HEADER */}
      <div className="ventas-header">
        <div className="ventas-header-left">
          <h1 className="ventas-title">Cargar Ventas</h1>
          {loading && <span className="loading-spinner">Cargando...</span>}
        </div>
        <div className="ventas-header-right">
          <div className="ventas-usuario">
            <User size={18} />
            <span>{usuario}</span>
          </div>

          {/* 🔥 NUEVO: BOTÓN EXPORTAR A EXCEL */}
          <button
            className="btn-exportar-excel"
            onClick={() => {
              setFechaExportInicio(filtros.fechaInicio || "");
              setFechaExportFin(filtros.fechaFin || "");
              setShowExportModal(true);
            }}
            disabled={loading}
          >
            <FileSpreadsheet size={18} />
            Exportar a Excel
          </button>

          <button
            className="btn-cargar"
            onClick={cargarVentas}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
            Cargar Ventas
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="ventas-buscador">
        <div className="ventas-buscador-wrapper">
          <Search size={18} className="ventas-buscador-icon" />
          <input
            type="text"
            placeholder="🔍 Buscar por factura, mesa, forma de pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ventas-input-buscar"
            disabled={loading}
          />
          {searchTerm && (
            <button
              className="ventas-buscador-limpiar"
              onClick={() => setSearchTerm("")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="ventas-btn-filtros"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          disabled={loading}
        >
          <Filter size={16} />
          <span>Filtros</span>
          <ChevronDown size={14} className={mostrarFiltros ? "rotate" : ""} />
        </button>
      </div>

      {/* PANEL DE FILTROS */}
      {mostrarFiltros && (
        <div className="ventas-filtros-panel">
          <div className="ventas-filtros-grid">
            <div className="ventas-filtro-group">
              <label><FileText size={14} /> Factura</label>
              <input
                type="text"
                name="factura"
                value={filtros.factura}
                onChange={handleFiltroChange}
                placeholder="Número de factura"
                className="ventas-filtro-input"
                disabled={loading}
              />
            </div>

            <div className="ventas-filtro-group">
              <label><User size={14} /> Mesa</label>
              <input
                type="text"
                name="mesa"
                value={filtros.mesa}
                onChange={handleFiltroChange}
                placeholder="Número de mesa"
                className="ventas-filtro-input"
                disabled={loading}
              />
            </div>

            <div className="ventas-filtro-group">
              <label><CreditCard size={14} /> Forma de pago</label>
              <select
                name="formaPago"
                value={filtros.formaPago}
                onChange={handleFiltroChange}
                className="ventas-filtro-input"
                disabled={loading}
              >
                {FORMAS_PAGO.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ventas-filtro-group">
              <label><Calendar size={14} /> Fecha desde</label>
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
                className="ventas-filtro-input"
                disabled={loading}
              />
            </div>

            <div className="ventas-filtro-group">
              <label><Calendar size={14} /> Fecha hasta</label>
              <input
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
                className="ventas-filtro-input"
                disabled={loading}
              />
            </div>

            <div className="ventas-filtro-actions">
              <button
                className="ventas-filtro-btn-limpiar"
                onClick={limpiarFiltros}
                disabled={loading}
              >
                Limpiar
              </button>
              <button
                className="ventas-filtro-btn-aplicar"
                onClick={aplicarFiltrosYRecargar}
                disabled={loading}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESUMEN */}
      <div className="ventas-resumen">
        <div className="ventas-resumen-item">
          <span className="ventas-resumen-label">Total ventas:</span>
          <span className="ventas-resumen-valor">{totalVentas}</span>
        </div>
        <div className="ventas-resumen-item">
          <span className="ventas-resumen-label">Total recaudado:</span>
          <span className="ventas-resumen-valor">${totalValor.toLocaleString()}</span>
        </div>
        {ultimaActualizacion && (
          <div className="ventas-resumen-item">
            <span className="ventas-resumen-label">Última actualización:</span>
            <span className="ventas-resumen-valor">{ultimaActualizacion}</span>
          </div>
        )}
      </div>

      {/* ✅ TABLA CON PRODUCTOS EN FILAS SEPARADAS Y BIEN PARSEADOS */}
      <div className="ventas-table-wrapper">
        <table className="ventas-table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Valor</th>
              <th>Mesa</th>
              <th>Forma de pago</th>
              <th>Usuario</th>
              <th>Cancelada</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" className="ventas-empty">
                  {searchTerm || Object.values(filtros).some(f => f)
                    ? "No hay ventas que coincidan con los filtros"
                    : "No hay ventas registradas"}
                </td>
              </tr>
            ) : (
              paginatedData.map((venta, index) => {
                let fechaMostrar = "--";
                if (venta.created_at) {
                  const fechaObj = new Date(venta.created_at);
                  if (!isNaN(fechaObj.getTime())) {
                    fechaMostrar = fechaObj.toLocaleDateString();
                  }
                }

                // ✅ PARSEO CORRECTO DEL JSON DE items
                let itemsVenta = [];
                if (venta.items) {
                  try {
                    // Si es string, lo convertimos a objeto
                    const parsed = typeof venta.items === 'string'
                      ? JSON.parse(venta.items)
                      : venta.items;

                    // Asegurarnos de que es un array
                    itemsVenta = Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
                    console.error("Error parseando items:", e);
                    itemsVenta = [];
                  }
                }

                if (itemsVenta.length === 0) {
                  return (
                    <tr key={`venta-vacia-${index}`}>
                      <td>{venta.numero_factura || "--"}</td>
                      <td>{fechaMostrar}</td>
                      <td>--</td>
                      <td>--</td>
                      <td>${venta.total?.toLocaleString() || 0}</td>
                      <td>
                        {venta.table_number === 1 || venta.table_number === 2 || venta.table_number === 3 || venta.table_number === 4
                          ? `Mesa ${venta.table_number}`
                          : "Caja"}
                      </td>
                      <td>{venta.forma_pago || "--"}</td>
                      <td>{venta.created_by || "--"}</td>
                      <td>
                        <span className={`ventas-badge ${venta.cancelada === true ? "cancelada" : "activa"}`}>
                          {venta.cancelada === true ? "SÍ" : "NO"}
                        </span>
                      </td>
                    </tr>
                  );
                }

                // Renderizar cada producto en su propia fila
                return itemsVenta.map((item, itemIndex) => {
                  const esPrimeraFila = itemIndex === 0;

                  return (
                    <tr key={`${venta.id || index}-${itemIndex}`}>
                      {esPrimeraFila && (
                        <td rowSpan={itemsVenta.length}>
                          {venta.numero_factura || "--"}
                        </td>
                      )}
                      {esPrimeraFila && (
                        <td rowSpan={itemsVenta.length}>{fechaMostrar}</td>
                      )}

                      {/* 🛑 PRODUCTO SIEMPRE EN SU FILA */}
                      <td>{getItemName(item)}</td>

                      {/* 🛑 CANTIDAD SIEMPRE EN SU FILA (soporta qty/quantity/cantidad) */}
                      <td>{getItemQty(item)}</td>

                      {/* 🛑 VALOR SIEMPRE EN SU FILA (soporta price/valor/precio/importe) */}
                      <td>${getItemPrice(item).toLocaleString()}</td>

                      {esPrimeraFila && (
                        <td rowSpan={itemsVenta.length}>
                          {venta.table_number === 1 || venta.table_number === 2 || venta.table_number === 3 || venta.table_number === 4
                            ? `Mesa ${venta.table_number}`
                            : "Caja"}
                        </td>
                      )}
                      {esPrimeraFila && (
                        <td rowSpan={itemsVenta.length}>
                          {venta.forma_pago || "--"}
                        </td>
                      )}
                      {esPrimeraFila && (
                        <td rowSpan={itemsVenta.length}>
                          {venta.created_by || "--"}
                        </td>
                      )}
                      {esPrimeraFila && (
                        <td rowSpan={itemsVenta.length}>
                          <span className={`ventas-badge ${venta.cancelada === true ? "cancelada" : "activa"}`}>
                            {venta.cancelada === true ? "SÍ" : "NO"}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>

        <Paginador
          totalItems={ventasFiltradas.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

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
                Selecciona el rango de fechas que quieres incluir en el reporte.
              </p>

              <div className="form-group">
                <label>Fecha inicio</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaExportInicio}
                  onChange={(e) => setFechaExportInicio(e.target.value)}
                  disabled={exporting}
                />
              </div>

              <div className="form-group">
                <label>Fecha fin</label>
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