import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchSalesSummary,
  fetchClientesList,
  fetchEmpleados,
  fetchAllSales,
  fetchMenu,
  fetchWeeklySales,
  fetchMenuProductCount,
} from "../api";
import { ShoppingCart, Boxes, Users, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import logoBg from "../assets/Recurso 12PCR-ALTA.png";
import "./DashboardHome.css";

export default function DashboardHome() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);

  // Datos de las tarjetas
  const [sales, setSales] = useState({ count: 0, totalAmount: 0 });
  const [inventoryCount, setInventoryCount] = useState(0);
  const [clientesCount, setClientesCount] = useState(0);
  const [empleadosCount, setEmpleadosCount] = useState(0);

  // Datos reales para las listas
  const [recentSales, setRecentSales] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  // ✅ Datos REALES para el gráfico
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Cargar datos de las tarjetas
      const salesData = await fetchSalesSummary(token);
      setSales(salesData);

      const menuCount = await fetchMenuProductCount(token);
      setInventoryCount(menuCount.total);

      const clientesData = await fetchClientesList(token);
      setClientesCount(clientesData.length);

      const empleadosData = await fetchEmpleados(token);
      setEmpleadosCount(empleadosData.length);

      // 2. Cargar datos reales para las listas
      const allSales = await fetchAllSales(token);
      setRecentSales(allSales.slice(0, 4));

      const menuData = await fetchMenu(token);
      const allProducts = menuData.categories.flatMap((cat) => cat.items);
      setPopularProducts(allProducts.slice(0, 4));

      // ✅ 3. Cargar datos REALES para el gráfico
      const weeklyData = await fetchWeeklySales(token);

      // 🔥 Mapa para traducir días del inglés al español
      const daysMap = {
        'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié',
        'Thu': 'Jue', 'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom'
      };

      // Transformar los datos y traducir los días
      const formattedData = weeklyData.map((item) => ({
        name: daysMap[item.day_name] || item.day_name || 'Sin datos',
        ventas: parseFloat(item.total) || 0,
      }));

      // Si no hay datos, poner ceros para que no se rompa el gráfico
      if (formattedData.length === 0) {
        const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        formattedData.push(...days.map((day) => ({ name: day, ventas: 0 })));
      }

      setChartData(formattedData);
    } catch (error) {
      console.error("Error cargando datos del Home:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-home">
      {/* HEADER (USUARIO IZQ - CENTRO - LOGO DERECHA) */}
      <div className="home-header">
        <div className="header-left">
          <span className="user-badge">
            <Users size={16} /> {user?.username || "Admin"}
          </span>
        </div>
        <div className="header-center">
          <h1>Panel de Control</h1>
        </div>
        <div className="header-right">
          <img src={logoBg} alt="Pecario" className="header-logo" />
        </div>
      </div>

      {loading ? (
        <div className="home-loading">Cargando datos...</div>
      ) : (
        <>
          {/* TARJETAS */}
          <div className="kpi-grid">
            <div className="kpi-card card-sales">
              <div className="kpi-content">
                <span className="kpi-label">Ventas del día</span>
                <span className="kpi-value">
                  ${sales.totalAmount.toLocaleString()}
                </span>
                <span className="kpi-detail">{sales.count} ventas</span>
              </div>
              <div className="kpi-icon">
                <TrendingUp size={32} />
              </div>
            </div>

            <div className="kpi-card card-products">
              <div className="kpi-content">
                <span className="kpi-label">Productos</span>
                <span className="kpi-value">{inventoryCount}</span>
                <span className="kpi-detail">en el menú</span>
              </div>
              <div className="kpi-icon">
                <Boxes size={32} />
              </div>
            </div>

            <div className="kpi-card card-clients">
              <div className="kpi-content">
                <span className="kpi-label">Clientes</span>
                <span className="kpi-value">{clientesCount}</span>
                <span className="kpi-detail">registrados</span>
              </div>
              <div className="kpi-icon">
                <Users size={32} />
              </div>
            </div>

            <div className="kpi-card card-employees">
              <div className="kpi-content">
                <span className="kpi-label">Empleados</span>
                <span className="kpi-value">{empleadosCount}</span>
                <span className="kpi-detail">activos</span>
              </div>
              <div className="kpi-icon">
                <ShoppingCart size={32} />
              </div>
            </div>
          </div>

          {/* GRÁFICO (YA CON DATOS REALES Y FORMATO CORRECTO) */}
          <div className="chart-section">
            <h2>Gráfico de Ventas (Últimos 7 días)</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  {/* ✅ CORREGIDO: Precios completos sin dividir entre 1000 */}
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#ef761f"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#ef761f" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LISTAS */}
          <div className="home-bottom-grid">
            <div className="bottom-card">
              <h3>📋 Últimas Ventas</h3>
              <ul className="recent-list">
                {recentSales.length === 0 ? (
                  <li>No hay ventas recientes.</li>
                ) : (
                  recentSales.map((sale) => (
                    <li key={sale.id}>
                      <span>{sale.numero_factura || `#${sale.id}`}</span>
                      <span>${sale.total?.toLocaleString()}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="bottom-card">
              <h3>🔥 Productos Populares</h3>
              <ul className="recent-list">
                {popularProducts.length === 0 ? (
                  <li>No hay productos registrados.</li>
                ) : (
                  popularProducts.map((prod) => (
                    <li key={prod.id}>
                      <span>{prod.name}</span>
                      <span>${prod.price?.toLocaleString()}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}