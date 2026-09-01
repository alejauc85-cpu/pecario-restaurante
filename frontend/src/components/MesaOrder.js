// src/components/MesaOrder.js
import React, { useState, useEffect } from "react";
import SalePanel from "../pages/Empleado/SalePanel";

export default function MesaOrder({ 
  tableNumber, 
  isOpen = false,
  initialOrderItems = [],
  initialTotal = 0,
  onOpenSale, 
  onCloseSale, 
  onSaved,
  onUpdateOrder 
}) {
  const [isOpenState, setIsOpenState] = useState(isOpen);

  useEffect(() => {
    setIsOpenState(isOpen);
  }, [isOpen]);

  const handleOpenSale = () => {
    setIsOpenState(true);
    if (onOpenSale) {
      onOpenSale();
    }
  };

  const handleCloseSale = () => {
    setIsOpenState(false);
    if (onCloseSale) {
      onCloseSale();
    }
  };

  // ✅ Cuando se actualiza el pedido, notificar al padre
  const handleOrderUpdate = (items, total) => {
    if (onUpdateOrder) {
      onUpdateOrder(items, total);
    }
  };

  const handleSaved = () => {
    setIsOpenState(false);
    if (onSaved) {
      onSaved();
    }
  };

  return (
    <SalePanel
      key={`mesa-${tableNumber}-${isOpenState}`}
      title={`Mesa ${tableNumber}`}
      isTable={true}
      tableNumber={tableNumber}
      isOpen={isOpenState}
      initialOrderItems={initialOrderItems}
      initialTotal={initialTotal}
      onOpenSale={handleOpenSale}
      onCloseSale={handleCloseSale}
      onSaved={handleSaved}
      onOrderUpdate={handleOrderUpdate}
      mode="table"
    />
  );
}