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

// Estado de las mesas (4 mesas) - Ahora con orderItems para guardar los productos
const TABLES = [
  { 
    id: 1, 
    number: 1, 
    isOccupied: false, 
    order: null, 
    orderItems: [], // ✅ Guarda los productos seleccionados
    total: 0,
    imageIndex: 0 
  },
  { 
    id: 2, 
    number: 2, 
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 1 
  },
  { 
    id: 3, 
    number: 3, 
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 2 
  },
  { 
    id: 4, 
    number: 4, 
    isOccupied: false, 
    order: null, 
    orderItems: [],
    total: 0,
    imageIndex: 3 
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

  // ✅ Actualizar el pedido de la mesa (se llama desde SalePanel)
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
    // Actualizar también la mesa seleccionada
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

  // Cerrar mesa (cuando se cierra el modal manualmente)
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

  // ✅ Guardar venta - Cierra la mesa y vuelve a disponible
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

  return (
    <div className="mesa-grid-view">
      <header className="mesa-grid-view-header">
        <h1>Mesas</h1>
        <span className="mesa-grid-view-count">
          {mesas.filter(m => m.isOccupied).length} ocupadas / {mesas.length} total
        </span>
      </header>

      <div className="mesa-grid-cards">
        {mesas.map((mesa) => {
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
        })}
      </div>

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