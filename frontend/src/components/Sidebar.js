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
  Clock, // ← NUEVO: para Horarios (comentado por ahora)
  ChefHat, // ✅ NUEVO: para Fórmulas/Recetas
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import { NAV_BY_ROLE } from "../data/navigation";
import logo from "../assets/Recurso 7PCR-ALTA.png";
import "./Sidebar.css";

// ============================================
// 🎨 ICONOS POR ID
// ============================================
const ICONS = {
  // ===== SISTEMA =====
  home: LayoutDashboard,
  "datos-empleados": UserCog,
  configuracion: Settings,
  empleados: Users, // ✅ AGREGADO: Ícono de empleados

  // ===== MENÚ PRINCIPAL =====
  "ingresar-pedidos": ShoppingCart,
  inventario: Boxes,
  "productos-menu": UtensilsCrossed,
  menu: UtensilsCrossed,
  formulas: ChefHat, // ✅ NUEVA: ícono para Fórmulas/Recetas
  // horarios: Clock,        // ← COMENTADO: Disponible si se necesita
  proveedores: Truck,

  // ===== VENTAS =====
  "ventas-grupo": ShoppingCart,
  "consultar-ventas": ShoppingCart,
  "cancelar-venta": ShoppingCart,
  clientes: Users,

  // ===== INVENTARIO =====
  "inventario-grupo": Boxes,
  "inventario-logs": Boxes,
  "comparativa-precios": Boxes,
  perdidas: Boxes,
  "registrar-perdidas": Boxes,

  // ===== CUENTAS Y CAJA =====
  "contabilidad-grupo": Wallet,
  "cuentas-pagar": Wallet,
  "cuenta-pagar": Wallet,
  "cuentas-cobrar": Wallet,
  gastos: Wallet,
  "caja-mayor": Wallet,
  "arqueo-caja": Wallet, // ✅ AGREGADO: Ícono para Arqueo de caja

  // ===== REPORTES =====
  "reportes-grupo": BarChart3,
  "reportes-generales": BarChart3,

  // ===== EMPLEADO =====
  caja: Wallet,
  mesas: Table2,
};

// ============================================
// 🖼️ COMPONENTE ICONO
// ============================================
function IconFor({ id }) {
  const Icon = ICONS[id] || Circle;
  return <Icon size={18} strokeWidth={1.8} aria-hidden="true" />;
}

// ============================================
// 📋 SIDEBAR PRINCIPAL
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
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      {/* ===== BRAND / LOGO ===== */}
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

      {/* ===== NAVEGACIÓN ===== */}
      <nav className="sidebar-nav" aria-label="Navegación">
        {items.map((item) =>
          item.children ? (
            // ===== GRUPO CON SUBMENÚ =====
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
            // ===== ÍTEM INDIVIDUAL =====
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

      {/* ===== FOOTER: USUARIO + LOGOUT ===== */}
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
  );
}