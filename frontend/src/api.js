import { notifySessionExpired } from "./context/sessionEvents";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin body (poco común, pero no debe romper el flujo)
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      notifySessionExpired();
    }
    const message = data?.error || "Ocurrió un error al conectar con el servidor.";
    throw new Error(message);
  }

  return data;
}

// ============================================
// AUTENTICACIÓN
// ============================================

export function loginRequest(username, password) {
  return request("/api/auth/login", { method: "POST", body: { username, password } });
}

// ============================================
// MENÚ
// ============================================

export function fetchMenu(token) {
  return request("/api/menu", { token });
}

// ✅ CRUD DE ÍTEMS DEL MENÚ
export function createMenuItem(token, data) {
  return request("/api/menu/items", { 
    method: "POST", 
    token, 
    body: data 
  });
}

export function updateMenuItem(token, id, data) {
  return request(`/api/menu/items/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

export function deleteMenuItem(token, id) {
  return request(`/api/menu/items/${id}`, { 
    method: "DELETE", 
    token 
  });
}

// ✅ CRUD DE CATEGORÍAS DEL MENÚ (NUEVAS FUNCIONES)
export function createMenuCategory(token, data) {
  return request("/api/menu/categories", { 
    method: "POST", 
    token, 
    body: data 
  });
}

export function updateMenuCategory(token, id, data) {
  return request(`/api/menu/categories/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

export function deleteMenuCategory(token, id) {
  return request(`/api/menu/categories/${id}`, { 
    method: "DELETE", 
    token 
  });
}

// ============================================
// VENTAS
// ============================================

export function saveSale(token, saleData) {
  return request("/api/sales", { 
    method: "POST", 
    token, 
    body: saleData 
  });
}

export function fetchSalesSummary(token) {
  return request("/api/sales/summary", { token });
}

// ============================================
// ✅ INVENTARIO
// ============================================

export function fetchInventory(token) {
  return request("/api/inventory", { token });
}

export function createInventoryItem(token, data) {
  return request("/api/inventory", { 
    method: "POST", 
    token, 
    body: data 
  });
}

export function updateInventoryItem(token, id, data) {
  return request(`/api/inventory/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

export function deleteInventoryItem(token, id) {
  return request(`/api/inventory/${id}`, { 
    method: "DELETE", 
    token 
  });
}

export function checkLowStock(token) {
  return request("/api/inventory/low-stock", { token });
}

// ============================================
// ✅ PEDIDOS (NUEVO)
// ============================================

// Obtener todos los pedidos
export function fetchPedidos(token) {
  return request("/api/pedidos", { token });
}

// Obtener un pedido por ID
export function fetchPedidoById(token, id) {
  return request(`/api/pedidos/${id}`, { token });
}

// Obtener proveedores (para el select)
export function fetchProveedores(token) {
  return request("/api/pedidos/proveedores", { token });
}

// Crear un nuevo pedido
export function createPedido(token, data) {
  return request("/api/pedidos", { 
    method: "POST", 
    token, 
    body: data 
  });
}

// Actualizar un pedido
export function updatePedido(token, id, data) {
  return request(`/api/pedidos/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

// Eliminar un pedido
export function deletePedido(token, id) {
  return request(`/api/pedidos/${id}`, { 
    method: "DELETE", 
    token 
  });
}

// Resumen de pedidos
export function fetchPedidosSummary(token) {
  return request("/api/pedidos/summary", { token });
}

// ============================================
// ✅ PROVEEDORES
// ============================================

// Obtener todos los proveedores
export function fetchProveedoresList(token) {
  return request("/api/proveedores", { token });
}

// Obtener un proveedor por ID
export function fetchProveedorById(token, id) {
  return request(`/api/proveedores/${id}`, { token });
}

// Crear un nuevo proveedor
export function createProveedor(token, data) {
  return request("/api/proveedores", { 
    method: "POST", 
    token, 
    body: data 
  });
}

// Actualizar un proveedor
export function updateProveedor(token, id, data) {
  return request(`/api/proveedores/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

// Eliminar un proveedor
export function deleteProveedor(token, id) {
  return request(`/api/proveedores/${id}`, { 
    method: "DELETE", 
    token 
  });
}

export function fetchBancos(token) {
  return request("/api/proveedores/bancos", { token });
}

// ============================================
// ✅ INVENTARIO - TOGGLE ESTADO
// ============================================

export function toggleInventoryStatus(token, id, status) {
  return request(`/api/inventory/${id}/toggle-status`, { 
    method: "PATCH", 
    token, 
    body: { status } 
  });
}

// ============================================
// ✅ VENTAS - OBTENER TODAS CON FILTROS
// ============================================

export function fetchAllSales(token, filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.factura) params.append('factura', filters.factura);
  if (filters.mesa) params.append('mesa', filters.mesa);
  if (filters.formaPago) params.append('formaPago', filters.formaPago);
  if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
  if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
  
  const url = `/api/sales/all${params.toString() ? '?' + params.toString() : ''}`;
  return request(url, { token });
}

// Cancelar una venta específica por su ID
export const cancelSale = async (token, id) => {
  return request(`/api/sales/${id}/cancel`, { method: 'PATCH', token });
};

// Obtener solo las ventas que ya están canceladas
export const fetchCanceledSales = (token) => {
  return request('/api/sales/canceled', { token });
};

// ============================================
// ✅ CLIENTES (NUEVAS FUNCIONES)
// ============================================

// Obtener todos los clientes
export function fetchClientesList(token) {
  return request("/api/clientes", { token });
}

// Obtener un cliente por ID
export function fetchClienteById(token, id) {
  return request(`/api/clientes/${id}`, { token });
}

// Crear un nuevo cliente
export function createCliente(token, data) {
  return request("/api/clientes", { 
    method: "POST", 
    token, 
    body: data 
  });
}

// Actualizar un cliente
export function updateCliente(token, id, data) {
  return request(`/api/clientes/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

// Eliminar un cliente
export function deleteCliente(token, id) {
  return request(`/api/clientes/${id}`, { 
    method: "DELETE", 
    token 
  });
}

// ============================================
// ✅ CUENTAS POR PAGAR
// ============================================

// Obtener todas las cuentas por pagar
export function fetchCuentasPagar(token) {
  return request("/api/cuentas-pagar", { token });
}

// Obtener una cuenta por ID
export function fetchCuentaPagarById(token, id) {
  return request(`/api/cuentas-pagar/${id}`, { token });
}

// Crear una nueva cuenta por pagar
export function createCuentaPagar(token, data) {
  return request("/api/cuentas-pagar", { 
    method: "POST", 
    token, 
    body: data 
  });
}

// Actualizar una cuenta por pagar
export function updateCuentaPagar(token, id, data) {
  return request(`/api/cuentas-pagar/${id}`, { 
    method: "PUT", 
    token, 
    body: data 
  });
}

// Eliminar una cuenta por pagar
export function deleteCuentaPagar(token, id) {
  return request(`/api/cuentas-pagar/${id}`, { 
    method: "DELETE", 
    token 
  });
}

// ============================================
// ✅ GASTOS
// ============================================

// Obtener gastos con filtros (fechaInicio, fechaFin)
export function fetchGastos(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
  if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
  
  const url = `/api/gastos${params.toString() ? '?' + params.toString() : ''}`;
  return request(url, { token });
}

export function createGasto(token, data) {
  return request("/api/gastos", { method: "POST", token, body: data });
}

export function updateGasto(token, id, data) {
  return request(`/api/gastos/${id}`, { method: "PUT", token, body: data });
}

export function deleteGasto(token, id) {
  return request(`/api/gastos/${id}`, { method: "DELETE", token });
}

// ============================================
// ✅ EMPLEADOS
// ============================================

export function fetchEmpleados(token) {
  return request("/api/empleados", { token });
}

export function createEmpleado(token, data) {
  return request("/api/empleados", { method: "POST", token, body: data });
}

export function updateEmpleado(token, id, data) {
  return request(`/api/empleados/${id}`, { method: "PUT", token, body: data });
}

export function deleteEmpleado(token, id) {
  return request(`/api/empleados/${id}`, { method: "DELETE", token });
}

export function fetchVacacionesHistorial(token, empleadoId) {
  return request(`/api/empleados/${empleadoId}/vacaciones`, { token });
}

export function createVacacion(token, empleadoId, data) {
  return request(`/api/empleados/${empleadoId}/vacaciones`, { method: "POST", token, body: data });
}

export function deleteVacacion(token, empleadoId, vacacionId) {
  return request(`/api/empleados/${empleadoId}/vacaciones/${vacacionId}`, { method: "DELETE", token });
}

// ============================================
// ✅ ARQUEO DE CAJA
// ============================================

export async function fetchArqueo(token, fecha) {
  const data = await request(`/api/arqueo?fecha=${fecha}`, { token });

  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }

  return data || null;
}

export function createAperturaCaja(token, data) {
  return request("/api/arqueo", {
    method: "POST",
    token,
    body: data
  });
}

export function updateCierreCaja(token, id, data) {
  return request(`/api/arqueo/${id}`, {
    method: "PUT",
    token,
    body: data
  });
}

export const reabrirCaja = async (token, id) => {
  const res = await fetch(`${API_URL}/api/arqueo/${id}/reabrir`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Error al reabrir la caja.");
  }

  return res.json();
};
// Ventas de los últimos 7 días (para el gráfico)
export function fetchWeeklySales(token) {
  return request("/api/sales/weekly", { token });
}

// Conteo de productos del menú (para el Home)
export function fetchMenuProductCount(token) {
  return request("/api/menu/count", { token });
}

// ============================================
// ✅ RECETAS / FÓRMULA (solo Admin)
// ============================================

// Trae TODAS las recetas ya traducidas a texto legible
// (para la tabla resumen de la vista Fórmula)
// -> { recipes: [{ id, name, recipeText }, ...] }
export function fetchAllRecipes(token) {
  return request("/api/recipes", { token });
}

// Trae la receta de UN producto puntual (para editarla)
// -> { items: [...], recipeText }
export function fetchRecipe(token, menuItemId) {
  return request(`/api/recipes/${menuItemId}`, { token });
}

// Guarda (reemplaza) la receta completa de un producto.
// items: [{ type: "inventory" | "component", refId: number, quantity: number }]
export function saveRecipe(token, menuItemId, items) {
  return request(`/api/recipes/${menuItemId}`, {
    method: "PUT",
    token,
    body: { items },
  });
}

// Elimina toda la receta de un producto
export function deleteRecipe(token, menuItemId) {
  return request(`/api/recipes/${menuItemId}`, {
    method: "DELETE",
    token,
  });
}