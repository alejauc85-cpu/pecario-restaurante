import React, { useEffect, useState } from "react";
import MesaOrder from "./MesaOrder";
import { useAuth } from "../context/AuthContext";
import { fetchMesas, updateMesa } from "../api";

// Imágenes desde assets
import mesa1Img from "../assets/mesa_1.png";
import mesa2Img from "../assets/mesa_1.png";
import mesa3Img from "../assets/mesa_1.png";
import mesa4Img from "../assets/mesa_1.png";
import "./MesaGridView.css";

// Solo imágenes, sin nombres
const MESA_IMAGES = [
  { src: mesa1Img, alt: "Mesa 1" },
  { src: mesa2Img, alt: "Mesa 2" },
  { src: mesa3Img, alt: "Mesa 3" },
  { src: mesa4Img, alt: "Mesa 4" },
];

export default function MesaGridView() {
  const { token } = useAuth();

  const [mesas, setMesas] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // ============================================================
  // CARGAR MESAS DESDE EL BACKEND
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");

      try {
        const data = await fetchMesas(token);
        if (cancelled) return;

        const mesasConImagen = (data.mesas || []).map((mesa) => ({
          ...mesa,
          isOccupied: mesa.is_occupied,
          orderItems: mesa.order_items || [],
          total: Number(mesa.total) || 0,
          order:
            mesa.is_occupied
              ? {
                  items: (mesa.order_items || []).length,
                  total: Number(mesa.total) || 0,
                }
              : null,
          imageIndex: (mesa.number - 1) % MESA_IMAGES.length,
        }));

        setMesas(mesasConImagen);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Error cargando mesas:", err);
        setError(err.message || "No se pudieron cargar las mesas.");
        setStatus("error");
      }
    }

    if (token) load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ============================================================
  // HELPERS
  // ============================================================
  const updateMesaLocal = (mesaId, changes) => {
    setMesas((prev) =>
      prev.map((m) => (m.id === mesaId ? { ...m, ...changes } : m))
    );
    setSelectedTable((prev) =>
      prev && prev.id === mesaId ? { ...prev, ...changes } : prev
    );
  };

  // ============================================================
  // ABRIR MESA
  // ============================================================
  const handleOpenMesa = async (mesaId) => {
    const changes = {
      isOccupied: true,
      orderItems: [],
      total: 0,
      order: { items: 0, total: 0 },
    };

    updateMesaLocal(mesaId, changes);
    setModalKey((prev) => prev + 1);

    try {
      await updateMesa(token, mesaId, {
        isOccupied: true,
        orderItems: [],
        total: 0,
      });
    } catch (err) {
      console.error("Error abriendo mesa:", err);
    }
  };

  // ============================================================
  // ACTUALIZAR PEDIDO
  // ============================================================
  const handleUpdateOrder = async (mesaId, orderItems, total) => {
    const changes = {
      orderItems,
      total,
      order: { items: orderItems.length, total },
    };

    updateMesaLocal(mesaId, changes);

    try {
      await updateMesa(token, mesaId, { orderItems, total });
    } catch (err) {
      console.error("Error actualizando pedido:", err);
    }
  };

  // ============================================================
  // CERRAR MESA
  // ============================================================
  const handleCloseMesa = async (mesaId) => {
    const changes = {
      isOccupied: false,
      orderItems: [],
      total: 0,
      order: null,
    };

    updateMesaLocal(mesaId, changes);
    setSelectedTable(null);

    try {
      await updateMesa(token, mesaId, {
        isOccupied: false,
        orderItems: [],
        total: 0,
      });
    } catch (err) {
      console.error("Error cerrando mesa:", err);
    }
  };

  // ============================================================
  // GUARDAR VENTA
  // ============================================================
  const handleSaved = async (mesaId) => {
    await handleCloseMesa(mesaId);
    setModalKey((prev) => prev + 1);
  };

  // ============================================================
  // CLICK EN MESA
  // ============================================================
  const handleTableClick = (mesa) => {
    setSelectedTable(mesa);
  };

  const handleCloseModal = () => {
    setSelectedTable(null);
  };

  // ============================================================
  // SEPARAR MESAS POR ZONA
  // ============================================================
  const mesasExternas = mesas.filter((m) => m.zone === "externa");
  const mesasInternas = mesas.filter((m) => m.zone === "interna");

  // ============================================================
  // RENDER DE UNA MESA
  // ============================================================
  const renderMesaCard = (mesa) => {
    const image = MESA_IMAGES[mesa.imageIndex];
    const isOccupied = mesa.isOccupied;

    return (
      <button
        key={mesa.id}
        type="button"
        className={`mesa-card ${isOccupied ? "ocupada" : ""}`}
        onClick={() => handleTableClick(mesa)}
      >
        <img src={image.src} alt={image.alt} className="mesa-card-image" />
        <div className="mesa-card-overlay"></div>
        <span className="mesa-card-status-badge">
          {isOccupied ? "🔴 Ocupada" : "🟢 Disponible"}
        </span>
        <div className="mesa-card-header">
          <span className="mesa-card-number">Mesa {mesa.number}</span>
        </div>
        {isOccupied && mesa.order && (
          <div className="mesa-card-details">
            <span className="detail-item">
              📦 {mesa.orderItems?.length || 0} items
            </span>
            <span className="detail-item">
              💰 ${(mesa.total || 0).toLocaleString()}
            </span>
          </div>
        )}
      </button>
    );
  };

  // ============================================================
  // ESTADOS DE CARGA / ERROR
  // ============================================================
  if (status === "loading") {
    return (
      <div className="mesa-grid-view">
        <div className="menu-view-status">Cargando mesas…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mesa-grid-view">
        <div className="menu-view-status">
          No se pudieron cargar las mesas:
          <br />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mesa-grid-view">
      <header className="mesa-grid-view-header">
        <h1>Mesas</h1>
        <span className="mesa-grid-view-count">
          {mesas.filter((m) => m.isOccupied).length} ocupadas / {mesas.length} total
        </span>
      </header>

      {/* ZONA: MESAS INTERNAS (primero) */}
      <section className="mesa-zone">
        <h2 className="mesa-zone-title">
          🏠 Mesas Internas
          <span className="mesa-zone-count">
            {mesasInternas.filter((m) => m.isOccupied).length} / {mesasInternas.length}
          </span>
        </h2>
        <div className="mesa-grid-cards">
          {mesasInternas.map(renderMesaCard)}
        </div>
      </section>

      {/* ZONA: MESAS EXTERNAS (después) */}
      <section className="mesa-zone">
        <h2 className="mesa-zone-title">
          🌿 Mesas Externas
          <span className="mesa-zone-count">
            {mesasExternas.filter((m) => m.isOccupied).length} / {mesasExternas.length}
          </span>
        </h2>
        <div className="mesa-grid-cards">
          {mesasExternas.map(renderMesaCard)}
        </div>
      </section>

      {selectedTable && (
        <div className="mesa-modal-overlay" onClick={handleCloseModal}>
          <div className="mesa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mesa-modal-header">
              <h2>
                <span className="modal-mesa-icon">
                  <img
                    src={MESA_IMAGES[selectedTable.imageIndex].src}
                    alt="mesa"
                  />
                </span>
                Mesa {selectedTable.number}
                <span className="modal-mesa-zone">
                  • {selectedTable.zone === "externa" ? "Externa" : "Interna"}
                </span>
                {selectedTable.isOccupied && (
                  <span className="modal-mesa-status">• Ocupada</span>
                )}
                {!selectedTable.isOccupied && (
                  <span
                    className="modal-mesa-status"
                    style={{ color: "#6b7280" }}
                  >
                    • Disponible
                  </span>
                )}
              </h2>
              <button className="mesa-modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="mesa-modal-body">
              <MesaOrder
                key={`${selectedTable.id}-${modalKey}`}
                tableNumber={selectedTable.number}
                isOpen={selectedTable.isOccupied}
                initialOrderItems={selectedTable.orderItems || []}
                initialTotal={selectedTable.total || 0}
                onOpenSale={() => handleOpenMesa(selectedTable.id)}
                onCloseSale={() => handleCloseMesa(selectedTable.id)}
                onSaved={() => handleSaved(selectedTable.id)}
                onUpdateOrder={(items, total) =>
                  handleUpdateOrder(selectedTable.id, items, total)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}