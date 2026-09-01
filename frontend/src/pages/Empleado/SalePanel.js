import React, { useEffect, useMemo, useState, useRef } from "react";
import Swal from "sweetalert2";
import { Printer, Save, PlayCircle, X, ChevronDown, Plus, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchMenu, saveSale } from "../../api";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import FacturaPDF from "./FacturaPDF";
import logo from "../../assets/Recurso 17PCR-ALTA.png";
import "./SalePanel.css";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const PAYMENT_METHODS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "datafono", label: "Datáfono" },
];

// ============================================
// COMPONENTE PRINCIPAL SALE PANEL
// ============================================
export default function SalePanel({
  title,
  isTable = false,
  tableNumber = null,
  isOpen = false,
  onOpenSale,
  onCloseSale,
  onSaved,
  onOrderUpdate,
  initialOrderItems = [],
  initialTotal = 0,
  mode = "table",
}) {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  // Inicializar el pedido con los productos guardados
  const [order, setOrder] = useState(() => {
    const initialOrder = {};
    if (initialOrderItems && initialOrderItems.length > 0) {
      initialOrderItems.forEach((item) => {
        initialOrder[item.id] = {
          item: {
            id: item.id,
            name: item.name,
            price: item.price,
            categoryLabel: item.categoryLabel || "",
          },
          qty: item.qty || 1,
        };
      });
    }
    return initialOrder;
  });

  const [propina, setPropina] = useState(0);
  const [propinaPorcentaje, setPropinaPorcentaje] = useState(false);
  const [valorPagado, setValorPagado] = useState("");
  const [formaPago, setFormaPago] = useState("efectivo");

  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const prevOrderRef = useRef();

  // Resetear isPrinted cuando se abre la venta
  useEffect(() => {
    if (isOpen) {
      setIsPrinted(false);
    }
  }, [isOpen]);

  // Notificar al padre cuando cambia el pedido
  useEffect(() => {
    if (onOrderUpdate) {
      const items = Object.values(order).map(({ item, qty }) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: qty,
      }));
      const total = Object.values(order).reduce(
        (sum, { item, qty }) => sum + (item.price || 0) * qty,
        0,
      );

      const currentData = JSON.stringify({ items, total });
      const prevData = prevOrderRef.current;

      if (currentData !== prevData) {
        prevOrderRef.current = currentData;
        onOrderUpdate(items, total);
      }
    }
  }, [order, onOrderUpdate]);

  // Cargar menú
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await fetchMenu(token);
        if (cancelled) return;
        const sellable = data.categories.filter((c) => c.id !== "gestion");
        setCategories(sellable);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        if (!keepOpen) {
          setShowResults(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [keepOpen]);

  const allItems = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, categoryLabel: cat.label })),
      ),
    [categories],
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allItems;
    return allItems.filter((item) => item.name.toLowerCase().includes(term));
  }, [allItems, search]);

  function addItem(item, keepOpenAfterAdd = false) {
    setOrder((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, qty: (existing?.qty || 0) + 1 } };
    });
    setSearch("");
    setIsPrinted(false);

    if (keepOpenAfterAdd || keepOpen) {
      setShowResults(true);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 10);
    } else {
      setShowResults(false);
    }
  }

  function decQty(itemId) {
    setOrder((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...existing, qty: existing.qty - 1 } };
    });
    setIsPrinted(false);
  }

  function removeLine(itemId) {
    setOrder((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setIsPrinted(false);
  }

  const orderLines = Object.values(order);
  const total = useMemo(
    () => orderLines.reduce((sum, l) => sum + (l.item.price || 0) * l.qty, 0),
    [orderLines],
  );

  const propinaNum = Number(propina) || 0;
  const propinaAutomatica = propinaPorcentaje ? total * 0.1 : 0;
  const propinaTotal = propinaNum + propinaAutomatica;
  const totalConPropina = total + propinaTotal;

  const valorPagadoNum = Number(valorPagado) || 0;
  const cambio =
    formaPago === "efectivo" && valorPagadoNum > totalConPropina
      ? valorPagadoNum - totalConPropina
      : null;
  
  const pagoInsuficiente = formaPago === "efectivo" && valorPagadoNum > 0 && valorPagadoNum < totalConPropina;

  // Función para abrir el visor PDF
  function handleOpenPdfViewer() {
    if (orderLines.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin productos",
        text: "Agrega al menos un producto antes de ver la factura.",
      });
      return;
    }

    if (!valorPagadoNum || valorPagadoNum <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Valor pagado requerido",
        text: "Ingresa el valor pagado antes de generar la factura.",
      });
      return;
    }

    setShowPdfViewer(true);
  }

  // Función para confirmar impresión
  function handlePrintConfirm() {
    setShowPdfViewer(false);
    setIsPrinted(true);

    setTimeout(() => {
      window.print();
    }, 300);

    Swal.fire({
      icon: "success",
      title: "Factura enviada a imprimir",
      text: "La factura se ha enviado a la impresora. Ahora puedes guardar la venta.",
      confirmButtonColor: "var(--color-accent)",
      timer: 2500,
    });
  }

  function handleAbrirVenta() {
    onOpenSale?.();
    setIsPrinted(false);
    Swal.fire({
      icon: "success",
      title: "Venta abierta",
      text: `${title} quedó marcada como ocupada.`,
      confirmButtonColor: "var(--color-accent)",
      timer: 1600,
      showConfirmButton: false,
    });
  }

  function validationError() {
    if (orderLines.length === 0)
      return "Agrega al menos un producto antes de guardar.";
    if (!valorPagadoNum || valorPagadoNum <= 0)
      return "Ingresa el valor pagado.";
    if (!formaPago) return "Selecciona la forma de pago.";
    if (pagoInsuficiente) {
      return `El valor pagado es insuficiente. Faltan ${currency.format(totalConPropina - valorPagadoNum)}`;
    }
    if (mode === "table" && isTable && !isPrinted) {
      return "Debes generar la factura antes de guardar la venta.";
    }
    return null;
  }

  async function handleGuardar() {
    const error = validationError();
    if (error) {
      Swal.fire({ icon: "warning", title: "Faltan datos", text: error });
      return;
    }

    const confirmResult = await Swal.fire({
      icon: "question",
      title:
        mode === "table"
          ? isTable
            ? "¿Seguro que quieres cerrar la venta?"
            : "¿Confirmar la venta?"
          : "¿Confirmar esta venta?",
      text:
        mode === "table"
          ? isTable
            ? `Se guardará la cuenta de ${title} y la mesa quedará libre.`
            : `Se guardará esta venta de ${title}.`
          : `Se agregará esta venta al total del día.`,
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--color-accent)",
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const saleData = {
        tableNumber: mode === "table" ? tableNumber : null,
        items: orderLines.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty,
        })),
        propina: propinaTotal,
        total: totalConPropina,
        valorPagado: valorPagadoNum,
        formaPago,
      };

      const response = await saveSale(token, saleData);

      setOrder({});
      setPropina(0);
      setPropinaPorcentaje(false);
      setValorPagado("");
      setFormaPago("efectivo");
      setIsPrinted(false);

      if (mode === "table" && isTable) onCloseSale?.();
      onSaved?.();

      // Alerta de stock bajo
      if (response.lowStock && response.lowStock.length > 0) {
        await Swal.fire({
          icon: "warning",
          title: "⚠️ ¡Productos por agotarse!",
          html: `
            <div style="text-align: left; max-height: 250px; overflow-y: auto; padding: 4px;">
              <p style="color: #dc2626; font-weight: 600; margin-bottom: 10px; font-size: 14px;">
                Los siguientes productos tienen stock bajo:
              </p>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${response.lowStock.map(p => `
                  <li style="padding: 6px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">${p.name}</span>
                    <span style="color: #dc2626; font-weight: 700; background: #fee2e2; padding: 0 10px; border-radius: 4px;">
                      ${p.stock} ${p.unit || 'unidades'}
                    </span>
                  </li>
                `).join('')}
              </ul>
              <p style="font-size: 12px; color: #6b7280; margin-top: 12px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center;">
                ⚠️ Por favor, actualiza el inventario lo antes posible.
              </p>
            </div>
          `,
          confirmButtonColor: "#ef761f",
          confirmButtonText: "Entendido",
          width: 420,
          padding: "1.5rem",
        });
      }

      await Swal.fire({
        icon: "success",
        title: mode === "table" ? "Guardado exitosamente" : "Venta registrada",
        text: `Total: ${currency.format(totalConPropina)}`,
        confirmButtonColor: "var(--color-accent)",
        timer: 2000,
      });

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  const toggleKeepOpen = () => {
    setKeepOpen(!keepOpen);
    if (!keepOpen) {
      setShowResults(true);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 10);
    }
  };

  return (
    <div className="sale-panel">
      <header className="sale-panel-header">
        <h1>{title}</h1>
        {isTable && (
          <span className={`sale-panel-status-pill ${isOpen ? "is-open" : ""}`}>
            {isOpen ? "Venta abierta" : "Sin abrir"}
          </span>
        )}
        {mode === "cashier" && (
          <span className="sale-panel-status-pill cashier-mode">💵 Caja</span>
        )}
        {isTable && isOpen && isPrinted && (
          <span className="sale-panel-status-pill printed">
            ✓ Factura generada
          </span>
        )}
      </header>

      {status === "loading" && (
        <p className="sale-panel-loading">Cargando menú…</p>
      )}
      {status === "error" && (
        <p className="sale-panel-loading">No se pudo cargar el menú.</p>
      )}

      {status === "ready" && (
        <div className="sale-panel-body">
          <section className="addables-card">
            <h2 className="addables-title">Productos del pedido</h2>

            <div className="addables-search-wrap" ref={dropdownRef}>
              <input
                ref={searchInputRef}
                type="text"
                className="addables-search"
                placeholder="Selecciona o busca un producto…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => {
                  setShowResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowResults(false);
                    setSearch("");
                  }
                }}
              />
              <ChevronDown size={16} className="addables-search-icon" />

              {showResults && (
                <div className="addables-dropdown">
                  <div className="addables-dropdown-actions">
                    <button
                      type="button"
                      className={`addables-multi-toggle ${keepOpen ? "is-active" : ""}`}
                      onClick={toggleKeepOpen}
                    >
                      {keepOpen
                        ? "🔓 Selección múltiple activa"
                        : "🔒 Selección simple (click para múltiple)"}
                    </button>
                  </div>

                  {filteredItems.length === 0 && (
                    <p className="addables-dropdown-empty">Sin resultados</p>
                  )}
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="addables-dropdown-item-wrapper"
                    >
                      <button
                        type="button"
                        className="addables-dropdown-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addItem(item, false)}
                      >
                        <span className="item-name">{item.name}</span>
                        {item.price != null && (
                          <span className="item-price">
                            {currency.format(item.price)}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="addables-dropdown-add-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem(item, true);
                        }}
                        title="Agregar y seguir seleccionando"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {orderLines.length === 0 ? (
              <p className="sale-panel-empty">
                Todavía no has agregado productos.
              </p>
            ) : (
              <div className="addables-pills">
                {orderLines.map(({ item, qty }) => (
                  <button
                    type="button"
                    key={item.id}
                    className="addable-pill"
                    onClick={() => decQty(item.id)}
                    title="Toca para quitar una unidad"
                  >
                    <span className="addable-pill-name">
                      {item.name}
                      {qty > 1 && (
                        <span className="addable-pill-qty"> ×{qty}</span>
                      )}
                    </span>
                    {item.price != null && (
                      <span className="addable-pill-price">
                        {currency.format(item.price * qty)}
                      </span>
                    )}
                    <span
                      className="addable-pill-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLine(item.id);
                      }}
                      role="button"
                      aria-label={`Quitar ${item.name}`}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="addables-total">
              <span>Total pedido</span>
              <span>{currency.format(total)}</span>
            </div>
          </section>

          <section className="sale-totals">
            {/* <div className="sale-totals-row sale-totals-editable">
              <label htmlFor="propina">Propina personalizada</label>
              <input
                id="propina"
                type="number"
                min="0"
                inputMode="numeric"
                value={propina}
                onChange={(e) => setPropina(e.target.value)}
                placeholder="0"
              />
            </div> */}

            {/* <div className="sale-totals-row sale-totals-checkbox">
              <label className="propina-checkbox-label">
                <input
                  type="checkbox"
                  checked={propinaPorcentaje}
                  onChange={(e) => setPropinaPorcentaje(e.target.checked)}
                />
                <span>Agregar 10% de propina</span>
                <span className="propina-checkbox-total">
                  {total > 0 ? `(+${currency.format(total * 0.1)})` : "(+$0)"}
                </span>
              </label>
            </div> */}

            <div className="sale-totals-row sale-totals-final">
              <span>Total + Propina</span>
              <span>{currency.format(totalConPropina)}</span>
            </div>
          </section>

          <section className="sale-payment">
            <div className="sale-payment-row">
              <label htmlFor="valorPagado">Valor pagado *</label>
              <input
                id="valorPagado"
                type="number"
                min="0"
                inputMode="numeric"
                value={valorPagado}
                onChange={(e) => setValorPagado(e.target.value)}
                placeholder="$0"
                className={cambio !== null && cambio >= 0 ? "has-change" : pagoInsuficiente ? "has-insufficient" : ""}
              />
            </div>

            {/* ✅ CAMBIO A DEVOLVER */}
            {formaPago === "efectivo" && cambio !== null && cambio >= 0 && (
              <div className="sale-cambio-container">
                <div className="sale-cambio-box">
                  <span className="sale-cambio-label">💰 Cambio a devolver</span>
                  <span className="sale-cambio-monto">{currency.format(cambio)}</span>
                </div>
                {cambio === 0 && (
                  <p className="sale-cambio-exacto">✅ Pago exacto - No hay cambio</p>
                )}
              </div>
            )}

            {/* ✅ PAGO INSUFICIENTE */}
            {pagoInsuficiente && (
              <div className="sale-pago-insuficiente">
                ⚠️ El valor pagado es insuficiente. Faltan {currency.format(totalConPropina - valorPagadoNum)}
              </div>
            )}

            <div className="sale-payment-row">
              <label htmlFor="formaPago">Forma de pago *</label>
              <select
                id="formaPago"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {formaPago === "transferencia" && (
              <p className="sale-payment-hint">
                Transferencia: QR o Consignación
              </p>
            )}
            {formaPago === "datafono" && (
              <p className="sale-payment-hint">Datáfono: BOLD</p>
            )}
          </section>

          <section className="sale-actions">
            <button
              type="button"
              className={`sale-btn ${isPrinted ? "sale-btn-success" : "sale-btn-ghost"}`}
              onClick={handleOpenPdfViewer}
              disabled={orderLines.length === 0 || !valorPagadoNum || pagoInsuficiente}
            >
              <Eye size={16} />
              {isPrinted ? "✓ Factura generada" : "Ver factura"}
            </button>
            <button
              type="button"
              className={`sale-btn ${isPrinted ? "sale-btn-primary" : "sale-btn-disabled"}`}
              onClick={handleGuardar}
              disabled={saving || !isPrinted || pagoInsuficiente}
            >
              <Save size={16} />
              {saving
                ? "Guardando…"
                : mode === "cashier"
                  ? "Registrar venta"
                  : "Guardar"}
            </button>
            {isTable && !isOpen && mode === "table" && (
              <button
                type="button"
                className="sale-btn sale-btn-accent"
                onClick={handleAbrirVenta}
              >
                <PlayCircle size={16} />
                Abrir venta
              </button>
            )}
          </section>
        </div>
      )}

      {/* VISOR PDF */}
      {showPdfViewer && (
        <div className="pdf-viewer-overlay" onClick={() => setShowPdfViewer(false)}>
          <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-viewer-header">
              <h3>📄 Vista previa de factura</h3>
              <button className="pdf-viewer-close" onClick={() => setShowPdfViewer(false)}>
                ✕
              </button>
            </div>

            <div className="pdf-viewer-body">
              <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                <FacturaPDF
                  tableNumber={tableNumber}
                  items={orderLines.map(({ item, qty }) => ({
                    name: item.name,
                    price: item.price,
                    qty: qty,
                  }))}
                  subtotal={total}
                  propina={propinaTotal}
                  total={totalConPropina}
                  valorPagado={valorPagadoNum}
                  cambio={cambio}
                  formaPago={formaPago}
                  logoUrl={logo}
                />
              </PDFViewer>
            </div>

            <div className="pdf-viewer-actions">
              <button
                className="pdf-viewer-btn pdf-viewer-btn-secondary"
                onClick={() => setShowPdfViewer(false)}
              >
                Cancelar
              </button>
              <PDFDownloadLink
                document={
                  <FacturaPDF
                    tableNumber={tableNumber}
                    items={orderLines.map(({ item, qty }) => ({
                      name: item.name,
                      price: item.price,
                      qty: qty,
                    }))}
                    subtotal={total}
                    propina={propinaTotal}
                    total={totalConPropina}
                    valorPagado={valorPagadoNum}
                    cambio={cambio}
                    formaPago={formaPago}
                    logoUrl={logo}
                  />
                }
                fileName={`factura_${tableNumber || 'caja'}_${new Date().getTime()}.pdf`}
                className="pdf-viewer-btn pdf-viewer-btn-primary"
              >
                {({ loading }) =>
                  loading ? 'Generando PDF...' : '📥 Descargar PDF'
                }
              </PDFDownloadLink>
              <button
                className="pdf-viewer-btn pdf-viewer-btn-primary"
                onClick={handlePrintConfirm}
              >
                🖨️ Imprimir factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}