import React, { useState } from "react";
import Modal from "./Modal";
import MesaOrder from "./MesaOrder";
// Importar imágenes desde assets
import mesa1Img from "../assets/mesa_1.png";
import mesa2Img from "../assets/mesa_1.png";
import mesa3Img from "../assets/mesa_1.png";
import mesa4Img from "../assets/mesa_1.png";
import "./MesaGridView.css";

// Imágenes para cada mesa (importadas desde assets)
const MESA_IMAGES = [
  {
    src: mesa1Img,
    alt: "Mesa 1",
    name: "Mesa Familiar"
  },
  {
    src: mesa2Img,
    alt: "Mesa 2",
    name: "Mesa Ejecutiva"
  },
  {
    src: mesa3Img,
    alt: "Mesa 3",
    name: "Mesa VIP"
  },
  {
    src: mesa4Img,
    alt: "Mesa 4",
    name: "Mesa Terraza"
  }
];

// ✅ 6 MESAS: 4 externas + 2 internas
const TABLES = [
  { 
    id: 1, 
    number: 1, 
    zone: "externa",
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 0 
  },
  { 
    id: 2, 
    number: 2, 
    zone: "externa",
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 1 
  },
  { 
    id: 3, 
    number: 3, 
    zone: "externa",
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 2 
  },
  { 
    id: 4, 
    number: 4, 
    zone: "externa",
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 3 
  },
  { 
    id: 5, 
    number: 5, 
    zone: "interna",
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 0 
  },
  { 
    id: 6, 
    number: 6, 
    zone: "interna",
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 0 
  },
];

export default function MesaGridView() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [mesas, setMesas] = useState(TABLES);
  const [modalKey, setModalKey] = useState(0);

  // Abrir mesa
  const handleOpenMesa = (mesaId) => {
    setMesas(prev =>
      prev.map(m =>
        m.id === mesaId 
          ? { ...m, isOccupied: true, order: { items: 0, total: 0 } } 
          : m
      )
    );
    setSelectedTable(prev => {
      if (prev && prev.id === mesaId) {
        return { ...prev, isOccupied: true, order: { items: 0, total: 0 } };
      }
      return prev;
    });
    setModalKey(prev => prev + 1);
  };

  // Actualizar el pedido de la mesa
  const handleUpdateOrder = (mesaId, orderItems, total) => {
    setMesas(prev =>
      prev.map(m =>
        m.id === mesaId 
          ? { 
              ...m, 
              orderItems: orderItems, 
              total: total,
              order: { items: orderItems.length, total: total }
            } 
          : m
      )
    );
    setSelectedTable(prev => {
      if (prev && prev.id === mesaId) {
        return { 
          ...prev, 
          orderItems: orderItems, 
          total: total,
          order: { items: orderItems.length, total: total }
        };
      }
      return prev;
    });
  };

  // Cerrar mesa
  const handleCloseMesa = (mesaId) => {
    setMesas(prev =>
      prev.map(m =>
        m.id === mesaId 
          ? { ...m, isOccupied: false, order: null, orderItems: [], total: 0 } 
          : m
      )
    );
    setSelectedTable(null);
  };

  // Guardar venta
  const handleSaved = (mesaId) => {
    setMesas(prev =>
      prev.map(m =>
        m.id === mesaId 
          ? { ...m, isOccupied: false, order: null, orderItems: [], total: 0 } 
          : m
      )
    );
    setSelectedTable(null);
    setModalKey(prev => prev + 1);
  };

  const handleTableClick = (mesa) => {
    setSelectedTable(mesa);
  };

  const handleCloseModal = () => {
    setSelectedTable(null);
  };

  // ✅ Separar mesas por zona
  const mesasExternas = mesas.filter(m => m.zone === "externa");
  const mesasInternas = mesas.filter(m => m.zone === "interna");

  // Renderiza una tarjeta (reutilizable)
  const renderMesaCard = (mesa) => {
    const image = MESA_IMAGES[mesa.imageIndex];
    const isOccupied = mesa.isOccupied;

    return (
      <button
        key={mesa.id}
        type="button"
        className={`mesa-card ${isOccupied ? 'ocupada' : ''}`}
        onClick={() => handleTableClick(mesa)}
      >
        <img 
          src={image.src} 
          alt={image.alt}
          className="mesa-card-image"
        />
        <div className="mesa-card-overlay"></div>
        <span className="mesa-card-status-badge">
          {isOccupied ? '🔴 Ocupada' : '🟢 Disponible'}
        </span>
        <div className="mesa-card-header">
          <span className="mesa-card-number">Mesa {mesa.number}</span>
          <span className="mesa-card-name">{image.name}</span>
        </div>
        {isOccupied && mesa.order && (
          <div className="mesa-card-details">
            <span className="detail-item">📦 {mesa.orderItems?.length || 0} items</span>
            <span className="detail-item">💰 ${(mesa.total || 0).toLocaleString()}</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="mesa-grid-view">
      <header className="mesa-grid-view-header">
        <h1>Mesas</h1>
        <span className="mesa-grid-view-count">
          {mesas.filter(m => m.isOccupied).length} ocupadas / {mesas.length} total
        </span>
      </header>

      {/* ZONA: MESAS EXTERNAS */}
      <section className="mesa-zone">
        <h2 className="mesa-zone-title">
          🌿 Mesas Externas
          <span className="mesa-zone-count">
            {mesasExternas.filter(m => m.isOccupied).length} / {mesasExternas.length}
          </span>
        </h2>
        <div className="mesa-grid-cards">
          {mesasExternas.map(renderMesaCard)}
        </div>
      </section>

      {/* ZONA: MESAS INTERNAS */}
      <section className="mesa-zone">
        <h2 className="mesa-zone-title">
          🏠 Mesas Internas
          <span className="mesa-zone-count">
            {mesasInternas.filter(m => m.isOccupied).length} / {mesasInternas.length}
          </span>
        </h2>
        <div className="mesa-grid-cards">
          {mesasInternas.map(renderMesaCard)}
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
                  <span className="modal-mesa-status" style={{ color: '#6b7280' }}>• Disponible</span>
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
                onUpdateOrder={(items, total) => handleUpdateOrder(selectedTable.id, items, total)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}