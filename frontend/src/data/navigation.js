import { ROLES } from "../context/AuthContext";

export const NAV_BY_ROLE = {
  [ROLES.ADMIN]: [
    // ============================================
    // 📋 MENÚ PRINCIPAL (Operativo)
    // ============================================
    { id: "home", label: "Home" },
    { id: "arqueo-caja", label: "Arqueo de caja", icon: "Wallet" },
    { id: "ingresar-pedidos", label: "Ingresar pedidos" },
    
    {
      id: "productos-menu",
      label: "Productos del menú",
      children: [
        { id: "menu", label: "Administrar menú" },
        { id: "formulas", label: "Fórmulas / Recetas" }, // ✅ NUEVA
      ],
    },
    
    // { id: "horarios", label: "Horarios" },  // ← COMENTADO: Disponible si se necesita

    { id: "proveedores", label: "Proveedores" },

    // ============================================
    // 📦 INVENTARIO (agrupado)
    // ============================================
    {
      id: "inventario-grupo",
      label: "Inventario",
      children: [
        { id: "inventario", label: "Productos del inventario" },
        // { id: "inventario-logs", label: "Inventarios logs" },
        // { id: "comparativa-precios", label: "Comparativa precios" },
        // { id: "perdidas", label: "Pérdidas" },
        // { id: "registrar-perdidas", label: "Registrar pérdidas" },
      ],
    },

    // ============================================
    // 💰 VENTAS
    // ============================================
    {
      id: "ventas-grupo",
      label: "Ventas",
      children: [
        { id: "consultar-ventas", label: "Consultar ventas" },
        { id: "cancelar-ventas", label: "Cancelar venta" }, 
        { id: "clientes", label: "Clientes" }, 
      ],
    },

    // ============================================
    // 💳 CUENTAS Y CAJA (Financiero)
    // ============================================
    {
      id: "contabilidad-grupo",
      label: "Cuentas y Caja",
      children: [
        { id: "cuentas-pagar", label: "Cuentas por pagar" },
        // { id: "cuenta-pagar", label: "Ingresar cuenta por pagar" },
        // { id: "cuentas-cobrar", label: "Cuentas por cobrar" },
        { id: "gastos", label: "Gastos" },
        // { id: "caja-mayor", label: "Caja mayor" },
      ],
    },

    

    // ============================================
    // ⚙️ SISTEMA
    // ============================================
    // ✅ AGREGADO: Icono "Users" para Empleados
    { id: "empleados", label: "Empleados", icon: "Users" },
    // { id: "configuracion", label: "Configuración" },

    // ============================================
    // 📊 REPORTES
    // ============================================
    // {
    //   id: "reportes-grupo",
    //   label: "Reportes",
    //   children: [
    //     { id: "reportes-generales", label: "Reportes generales" },
    //   ],
    // },
  ],

  // ============================================
  // 👤 ROL EMPLEADO (se queda IGUAL — sin acceso a Fórmulas)
  // ============================================
 [ROLES.EMPLEADO]: [
  {
    id: "home",
    label: "Home",
    icon: "Home",
  },

  {
    id: "caja",
    label: "Caja",
    icon: "Wallet",
  },

  {
    id: "mesas",
    label: "Mesas",
  },

  {
    id: "menu",
    label: "Menú",
    icon: "UtensilsCrossed",
  },
],
};

export function findNavLabel(items, id) {
  for (const item of items) {
    if (item.id === id) return item.label;
    if (item.children) {
      const child = item.children.find((c) => c.id === id);
      if (child) return child.label;
    }
  }
  return id;
}