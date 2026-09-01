import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { cancelSale, fetchCanceledSales } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Paginador from "../../pages/Administrador/Paginador";
import "./CancelarVentas.css";

const ITEMS_PER_PAGE = 6;

export default function CancelarVentas() {
  const { token } = useAuth();
  const [numeroFactura, setNumeroFactura] = useState("");
  const [loading, setLoading] = useState(false);
  const [canceledSales, setCanceledSales] = useState([]);
  const [canceledFiltered, setCanceledFiltered] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar las ventas canceladas al iniciar
  useEffect(() => {
    loadCanceledSales();
  }, []);

  // Filtrar en tiempo real sobre las canceladas
  useEffect(() => {
    if (canceledSales.length === 0) return;
    let filtered = [...canceledSales];

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
    setCanceledFiltered(filtered);
    setCurrentPage(1);
  }, [canceledSales, searchTerm]);

  const loadCanceledSales = async () => {
    try {
      const data = await fetchCanceledSales(token);
      setCanceledSales(data);
      setCanceledFiltered(data);
    } catch (err) {
      console.error("Error cargando ventas canceladas:", err);
    }
  };

  const handleCancelar = async () => {
    if (!numeroFactura.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo vacío",
        text: "Por favor, ingresa el número de factura a cancelar.",
      });
      return;
    }

    // Extraer solo el número (ej: FT000000001 -> 1)
    const idFactura = numeroFactura.replace("FT", "").replace(/^0+/, "");

    const confirm = await Swal.fire({
      icon: "question",
      title: "¿Cancelar factura?",
      text: `¿Estás seguro de que quieres cancelar la factura ${numeroFactura}? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await cancelSale(token, idFactura);
      
      Swal.fire({
        icon: "success",
        title: "Factura cancelada",
        text: `La factura ${numeroFactura} ha sido cancelada exitosamente.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setNumeroFactura("");
      loadCanceledSales(); // Recargar la lista de canceladas
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo cancelar la factura.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return canceledFiltered.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();
  const totalVentas = canceledFiltered.length;
  const totalValor = canceledFiltered.reduce((sum, v) => sum + (v.total || 0), 0);

  return (
    <div className="cancelar-ventas-container">
      <div className="cancelar-header">
        <div className="cancelar-header-left">
          <h1 className="cancelar-title">Cancelar Ventas</h1>
        </div>
        <div className="cancelar-header-right">
          <button 
            className="cancelar-btn-reload" 
            onClick={loadCanceledSales} 
            disabled={loading}
          >
            Recargar lista
          </button>
        </div>
      </div>

      {/* Formulario para cancelar */}
      <div className="cancelar-form">
        <label htmlFor="facturaInput" className="cancelar-label">
          Número de factura a cancelar:
        </label>
        <div className="cancelar-input-wrapper">
          <input
            id="facturaInput"
            type="text"
            className="cancelar-input"
            placeholder="Ejemplo: FT000000001"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value.toUpperCase())}
          />
          <button 
            className="cancelar-btn" 
            onClick={handleCancelar} 
            disabled={loading}
          >
            {loading ? "Cancelando..." : "Cancelar Factura"}
          </button>
        </div>
      </div>

      {/* Barra de búsqueda para las canceladas */}
      <div className="cancelar-buscador">
        <div className="cancelar-buscador-wrapper">
          <input
            type="text"
            placeholder="🔍 Buscar en canceladas por factura, mesa, usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cancelar-input-buscar"
            disabled={loading}
          />
          {searchTerm && (
            <button
              className="cancelar-buscador-limpiar"
              onClick={() => setSearchTerm("")}
            >
              X
            </button>
          )}
        </div>
      </div>

      {/* Resumen solo de canceladas */}
      <div className="cancelar-resumen">
        <div className="cancelar-resumen-item">
          <span className="cancelar-resumen-label">Total canceladas:</span>
          <span className="cancelar-resumen-valor">{totalVentas}</span>
        </div>
        <div className="cancelar-resumen-item">
          <span className="cancelar-resumen-label">Total anulado:</span>
          <span className="cancelar-resumen-valor">${totalValor.toLocaleString()}</span>
        </div>
      </div>

      {/* ✅ TABLA CON LA MISMA ESTRUCTURA DE "Cargar Ventas" (incluye rowSpan y parseo de JSON) */}
      <div className="cancelar-table-wrapper">
        <table className="cancelar-table">
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
                <td colSpan="9" className="cancelar-empty">
                  {searchTerm 
                    ? "No hay facturas canceladas que coincidan con la búsqueda" 
                    : "No hay facturas canceladas registradas."}
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

                let itemsVenta = [];
                if (venta.items) {
                  try {
                    const parsed = typeof venta.items === 'string' 
                      ? JSON.parse(venta.items) 
                      : venta.items;
                    itemsVenta = Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
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
                        <span className="ventas-badge cancelada">SÍ</span>
                      </td>
                    </tr>
                  );
                }

                return itemsVenta.map((item, itemIndex) => {
                  const esPrimeraFila = itemIndex === 0;

                  return (
                    <tr key={`${venta.id || index}-${itemIndex}`}>
                      <td rowSpan={esPrimeraFila ? itemsVenta.length : 1}>
                        {esPrimeraFila ? (venta.numero_factura || "--") : null}
                      </td>
                      <td rowSpan={esPrimeraFila ? itemsVenta.length : 1}>
                        {esPrimeraFila ? fechaMostrar : null}
                      </td>
                      <td>{item.name || item.nombre || "--"}</td>
                      <td>{item.qty || item.quantity || "1"}</td>
                      <td>${(item.price || 0).toLocaleString()}</td>
                      <td rowSpan={esPrimeraFila ? itemsVenta.length : 1}>
                        {esPrimeraFila 
                          ? (venta.table_number === 1 || venta.table_number === 2 || venta.table_number === 3 || venta.table_number === 4 
                              ? `Mesa ${venta.table_number}` 
                              : "Caja")
                          : null}
                      </td>
                      <td rowSpan={esPrimeraFila ? itemsVenta.length : 1}>
                        {esPrimeraFila ? (venta.forma_pago || "--") : null}
                      </td>
                      <td rowSpan={esPrimeraFila ? itemsVenta.length : 1}>
                        {esPrimeraFila ? (venta.created_by || "--") : null}
                      </td>
                      <td rowSpan={esPrimeraFila ? itemsVenta.length : 1}>
                        {esPrimeraFila ? (
                          <span className="ventas-badge cancelada">SÍ</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>

        <Paginador
          totalItems={canceledFiltered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}