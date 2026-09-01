import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Paginador.css";

export default function Paginador({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generar números de página
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="paginador-container">
      <div className="paginador-info">
        Mostrando {startIndex} - {endIndex} de {totalItems} registros
      </div>

      <div className="paginador-controls">
        <button
          className="paginador-btn"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            className={`paginador-btn paginador-numero ${
              page === currentPage ? "is-active" : ""
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="paginador-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          title="Página siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}