import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.css";

export default function Modal({ onClose, children }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} strokeWidth={2} />
        </button>
        {children}
      </div>
    </div>
  );
}