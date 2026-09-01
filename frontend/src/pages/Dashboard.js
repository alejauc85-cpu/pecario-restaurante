import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { NAV_BY_ROLE, findNavLabel } from "../data/navigation";

import Sidebar from "../components/Sidebar";
import MenuView from "../components/MenuView";
import FormulaView from "../components/Formulaview"; // ✅ NUEVA
import MesaGridView from "../components/MesaGridView";

import CajasView from "./Empleado/CajaView";

import IngresarPedidos from "../pages/Administrador/IngresarPedidos.jsx";
import Proveedores from "./Administrador/Proveedores";
import Inventario from "./Administrador/ProductosInventario";
import CargarVentas from "./Administrador/CargarVentas";
import CancelarVentas from "./Administrador/CancelarVentas";
import Clientes from "./Administrador/Clientes";
import CuentasPagar from "./Administrador/CuentasPagar";
import Gastos from "./Administrador/Gastos";
import Empleados from "./Administrador/Empleados";
import ArqueoCaja from "./Administrador/ArqueoCaja";

import DashboardHome from "./DashboardHome";
import Placeholder from "../components/placeholder";

import "./Dashboard.css";
import logoBg from "../assets/Recurso 12PCR-ALTA.png";

export default function Dashboard() {
  const { user } = useAuth();

  const navItems = NAV_BY_ROLE[user?.role] || [];

  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (activeId === "home") {
      setActiveId(null);
    }
  }, [activeId]);

  /*
  ============================================================
  OBTENER NOMBRE DEL USUARIO
  ============================================================
  */

  const userName =
    user?.nombre ||
    user?.name ||
    user?.nombre_usuario ||
    user?.username ||
    user?.usuario ||
    "Usuario";

  /*
  ============================================================
  CONTENIDO PRINCIPAL
  ============================================================
  */

  function renderContent() {
    /*
    ==========================================================
    🏠 INICIO
    ==========================================================
    */

    if (!activeId) {

      /*
      ----------------------------------------------------------
      👤 EMPLEADO
      ----------------------------------------------------------
      */

      if (user?.role === "empleado") {
        return (
          <div className="employee-home">

            <div className="employee-home-content">

              {/* USUARIO */}
              <div className="employee-user">
                {/* <span className="employee-user-label">
                  Bienvenido
                </span> */}

                <h2 className="employee-user-name">
                  {userName}
                </h2>
              </div>

              {/* LOGO */}
              <img
                src={logoBg}
                alt="Logo"
                className="employee-logo"
              />

              {/* MENSAJE */}
              <div className="employee-message">

                <h1>
                  ¡Bienvenido!
                </h1>

                <p>
                  Selecciona una opción del menú lateral
                  para comenzar
                </p>

                <div className="employee-hint">

                  <span>
                    Selecciona una opción
                  </span>

                  <span className="employee-arrow">
                    →
                  </span>

                </div>

              </div>

            </div>

          </div>
        );
      }

      /*
      ----------------------------------------------------------
      👑 ADMINISTRADOR
      ----------------------------------------------------------
      */

      return <DashboardHome />;
    }

    /*
    ==========================================================
    📋 MENÚ
    ==========================================================
    */

    if (activeId === "menu") {
      return <MenuView />;
    }

    /*
    ==========================================================
    🧪 FÓRMULAS / RECETAS (solo Admin, ya lo controla el Sidebar
    porque este id solo existe en NAV_BY_ROLE[ROLES.ADMIN])
    ==========================================================
    */

    if (activeId === "formulas") {
      return <FormulaView />;
    }

    /*
    ==========================================================
    🪑 MESAS
    ==========================================================
    */

    if (activeId === "mesas") {
      return <MesaGridView />;
    }

    /*
    ==========================================================
    💰 CAJA
    ==========================================================
    */

    if (activeId === "caja") {
      return <CajasView />;
    }

    if (activeId === "cajas") {
      return <CajasView />;
    }

    /*
    ==========================================================
    🛒 INGRESAR PEDIDOS
    ==========================================================
    */

    if (activeId === "ingresar-pedidos") {
      return <IngresarPedidos />;
    }

    /*
    ==========================================================
    ⚙️ ADMINISTRACIÓN
    ==========================================================
    */

    if (activeId === "proveedores") {
      return <Proveedores />;
    }

    if (activeId === "inventario") {
      return <Inventario />;
    }

    if (activeId === "consultar-ventas") {
      return <CargarVentas />;
    }

    if (activeId === "cancelar-ventas") {
      return <CancelarVentas />;
    }

    if (activeId === "clientes") {
      return <Clientes />;
    }

    if (activeId === "cuentas-pagar") {
      return <CuentasPagar />;
    }

    if (activeId === "gastos") {
      return <Gastos />;
    }

    if (activeId === "empleados") {
      return <Empleados />;
    }

    if (activeId === "arqueo-caja") {
      return <ArqueoCaja />;
    }

    /*
    ==========================================================
    ⚙️ PLACEHOLDER
    ==========================================================
    */

    return (
      <Placeholder
        title={findNavLabel(navItems, activeId)}
      />
    );
  }

  /*
  ============================================================
  RENDER PRINCIPAL
  ============================================================
  */

  return (
    <div className="dashboard">

      <Sidebar
        activeId={activeId}
        onSelect={setActiveId}
      />

      <main className="dashboard-main">
        {renderContent()}
      </main>

    </div>
  );
}