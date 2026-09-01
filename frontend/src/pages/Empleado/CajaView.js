// src/pages/Empleado/CajaView.js
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchSalesSummary } from "../../api";
import SalePanel from "./SalePanel";
import "./CajaView.css";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function CajaView() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSummary = useCallback(async () => {
    if (!token) {
      console.warn("No hay token disponible");
      return;
    }
    
    try {
      const data = await fetchSalesSummary(token);
      setSummary(data);
      setError("");
    } catch (err) {
      console.error("Error al cargar resumen:", err);
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSaved = () => {
    // Recargar el resumen después de guardar una venta
    setRefreshKey(prev => prev + 1);
    loadSummary();
  };

  return (
    <div className="caja-view">
      <div className="caja-summary">
        <h2 className="caja-summary-title">💵 Ventas de hoy</h2>
        {error && <p className="caja-summary-error">No se pudo cargar el resumen.</p>}
        {!error && summary && (
          <div className="caja-summary-stats">
            <div className="caja-stat">
              <span className="caja-summary-number">{summary.count || 0}</span>
              <span className="caja-summary-label">
                {summary.count === 1 ? "venta" : "ventas"}
              </span>
            </div>
            <div className="caja-stat">
              <span className="caja-summary-number">{currency.format(summary.totalAmount || 0)}</span>
              <span className="caja-summary-label">total del día</span>
            </div>
          </div>
        )}
        {!error && !summary && (
          <p className="caja-summary-loading">Cargando resumen...</p>
        )}
      </div>

      <SalePanel
        key={refreshKey}
        title="Caja"
        isTable={false}
        mode="cashier" // ✅ Importante: modo caja
        onSaved={handleSaved}
      />
    </div>
  );
}