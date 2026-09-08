import React, { useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Boxes,
  Wallet,
  Truck,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Table2,
  LogOut,
  Circle,
  Clock,
  ChefHat,
  Store,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import { NAV_BY_ROLE } from "../data/navigation";
import logo from "../assets/Recurso 7PCR-ALTA.png";
import "./Sidebar.css";

// ============================================
// 🎨 ICONOS POR ID
// ============================================
const ICONS = {
  home: LayoutDashboard,
  "datos-empleados": UserCog,
  configuracion: Settings,
  empleados: Users,

  "ingresar-pedidos": ShoppingCart,
  inventario: Boxes,
  "productos-menu": UtensilsCrossed,
  menu: UtensilsCrossed,
  formulas: ChefHat,
  proveedores: Truck,

  "ventas-grupo": ShoppingCart,
  "consultar-ventas": ShoppingCart,
  "cancelar-venta": ShoppingCart,
  clientes: Users,

  "inventario-grupo": Boxes,
  "inventario-logs": Boxes,
  "comparativa-precios": Boxes,
  perdidas: Boxes,
  "registrar-perdidas": Boxes,

  "contabilidad-grupo": Wallet,
  "cuentas-pagar": Wallet,
  "cuenta-pagar": Wallet,
  "cuentas-cobrar": Wallet,
  gastos: Wallet,
  "caja-mayor": Wallet,
  "arqueo-caja": Wallet,

  "reportes-grupo": BarChart3,
  "reportes-generales": BarChart3,

  caja: Wallet,
  mesas: Table2,
  "menu-empleado": UtensilsCrossed,
  "ventas-en-local-grupo": Store,
};

// Cuántos íconos caben directo en la barra inferior antes de usar "+"
const MOBILE_MAX_VISIBLE = 4;

// ============================================
// 🖼️ COMPONENTE ICONO
// ============================================
function IconFor({ id, size = 18 }) {
  const Icon = ICONS[id] || Circle;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

// ============================================
// 📋 SIDEBAR PRINCIPAL — ESTA PARTE ES 100% IGUAL A LA ORIGINAL DE PC
// ============================================
export default function Sidebar({ activeId, onSelect }) {
  const { user, logout } = useAuth();
  const items = NAV_BY_ROLE[user.role] || [];
  const [collapsed, setCollapsed] = useState(false);

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    items.forEach((item) => {
      if (item.children?.some((c) => c.id === activeId)) initial[item.id] = true;
    });
    return initial;
  });

  function toggleGroup(id) {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [id]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      {/* ===== SIDEBAR DE ESCRITORIO (idéntico al original, se oculta vía CSS en móvil) ===== */}
      <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src={logo} alt="PECARIO" />
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación">
          {items.map((item) =>
            item.children ? (
              <div className="sidebar-group" key={item.id}>
                <button
                  type="button"
                  className={`sidebar-link sidebar-group-toggle ${
                    item.children.some((c) => c.id === activeId) ? "is-active" : ""
                  }`}
                  onClick={() => toggleGroup(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-link-icon">
                    <IconFor id={item.id} />
                  </span>
                  <span className="sidebar-link-label">{item.label}</span>
                  {!collapsed && (
                    <span className={`sidebar-chevron ${openGroups[item.id] ? "is-open" : ""}`}>
                      ›
                    </span>
                  )}
                </button>
                {!collapsed && openGroups[item.id] && (
                  <div className="sidebar-submenu">
                    {item.children.map((child) => (
                      <button
                        type="button"
                        key={child.id}
                        className={`sidebar-link sidebar-sublink ${
                          activeId === child.id ? "is-active" : ""
                        }`}
                        onClick={() => onSelect(child.id)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                key={item.id}
                className={`sidebar-link ${activeId === item.id ? "is-active" : ""}`}
                onClick={() => onSelect(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-link-icon">
                  <IconFor id={item.id} />
                </span>
                <span className="sidebar-link-label">{item.label}</span>
              </button>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" title={collapsed ? user.username : undefined}>
            <span className="sidebar-user-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <span className="sidebar-user-meta">
              <span className="sidebar-user-name">{user.username}</span>
              <span className="sidebar-user-role">{ROLE_LABELS[user.role]}</span>
            </span>
          </div>
          <button
            className="sidebar-logout"
            onClick={logout}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut size={16} strokeWidth={1.8} />
            <span className="sidebar-link-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ===== NUEVO: NAV INFERIOR — solo visible en móvil vía CSS ===== */}
      <MobileBottomNav
        items={items}
        activeId={activeId}
        onSelect={onSelect}
        user={user}
        logout={logout}
      />
    </>
  );
}

// ============================================
// 📱 NAV INFERIOR ESTILO TIKTOK (SOLO MÓVIL)
// ============================================
function MobileBottomNav({ items, activeId, onSelect, user, logout }) {
  const [showMore, setShowMore] = useState(false);
  const [groupSheet, setGroupSheet] = useState(null);

  const needsOverflow = items.length > MOBILE_MAX_VISIBLE;
  const visibleItems = needsOverflow ? items.slice(0, MOBILE_MAX_VISIBLE) : items;

  function isItemActive(item) {
    if (item.children) return item.children.some((c) => c.id === activeId);
    return item.id === activeId;
  }

  function handleTap(item) {
    if (item.children) {
      setGroupSheet(item);
      return;
    }
    onSelect(item.id);
    setShowMore(false);
    setGroupSheet(null);
  }

  function handleSelectChild(childId) {
    onSelect(childId);
    setGroupSheet(null);
    setShowMore(false);
  }

  function closeAll() {
    setShowMore(false);
    setGroupSheet(null);
  }

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        {visibleItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`mobile-nav-btn ${isItemActive(item) ? "is-active" : ""}`}
            onClick={() => handleTap(item)}
          >
            <span className="mobile-nav-icon">
              <IconFor id={item.id} size={20} />
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}

        {needsOverflow && (
          <button
            type="button"
            className={`mobile-nav-btn ${showMore ? "is-active" : ""}`}
            onClick={() => setShowMore(true)}
          >
            <span className="mobile-nav-icon">
              <Plus size={20} strokeWidth={2} />
            </span>
            <span className="mobile-nav-label">Más</span>
          </button>
        )}
      </nav>

      {/* ===== HOJA "MÁS": lista COMPLETA de opciones ===== */}
      {showMore && (
        <div className="mobile-sheet-backdrop" onClick={closeAll}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <span className="mobile-sheet-title">Menú</span>
              <button
                type="button"
                className="mobile-sheet-close"
                onClick={closeAll}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-grid">
              {items.map((item) =>
                item.children ? (
                  <button
                    type="button"
                    key={item.id}
                    className={`mobile-sheet-item ${isItemActive(item) ? "is-active" : ""}`}
                    onClick={() => setGroupSheet(item)}
                  >
                    <span className="mobile-sheet-item-icon">
                      <IconFor id={item.id} size={22} />
                    </span>
                    <span className="mobile-sheet-item-label">{item.label}</span>
                    <ChevronRight size={14} className="mobile-sheet-item-chevron" />
                  </button>
                ) : (
                  <button
                    type="button"
                    key={item.id}
                    className={`mobile-sheet-item ${activeId === item.id ? "is-active" : ""}`}
                    onClick={() => handleSelectChild(item.id)}
                  >
                    <span className="mobile-sheet-item-icon">
                      <IconFor id={item.id} size={22} />
                    </span>
                    <span className="mobile-sheet-item-label">{item.label}</span>
                  </button>
                )
              )}
            </div>

            <div className="mobile-sheet-footer">
              <div className="mobile-sheet-user">
                <span className="sidebar-user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="sidebar-user-meta">
                  <span className="sidebar-user-name">{user.username}</span>
                  <span className="sidebar-user-role">{ROLE_LABELS[user.role]}</span>
                </span>
              </div>
              <button className="sidebar-logout" onClick={logout}>
                <LogOut size={16} strokeWidth={1.8} />
                <span className="sidebar-link-label">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HOJA DE SUBMENÚ (hijos de un grupo específico) ===== */}
      {groupSheet && (
        <div className="mobile-sheet-backdrop" onClick={closeAll}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <span className="mobile-sheet-title">{groupSheet.label}</span>
              <button
                type="button"
                className="mobile-sheet-close"
                onClick={closeAll}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-list">
              {groupSheet.children.map((child) => (
                <button
                  type="button"
                  key={child.id}
                  className={`mobile-sheet-list-item ${
                    activeId === child.id ? "is-active" : ""
                  }`}
                  onClick={() => handleSelectChild(child.id)}
                >
                  {child.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}