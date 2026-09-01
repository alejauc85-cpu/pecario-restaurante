import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Calendar,
  Plus,
  X,
  Save,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  fetchAllSales,
  fetchGastos,
  fetchArqueo,
  createAperturaCaja,
  updateCierreCaja,
  reabrirCaja, // ✅ NUEVO: Importar la función para reabrir
} from "../../api";
import Paginador from "../../pages/Administrador/Paginador";
import "./ArqueoCaja.css";

const ITEMS_PER_PAGE = 10;

export default function ArqueoCaja() {
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fecha, setFecha] = useState(
    new Date()
      .toLocaleString("en-CA", {
        timeZone: "America/Bogota",
      })
      .split(",")[0]
  );

  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // ============================================
  // DATOS DEL ARQUEO
  // ============================================

  const [aperturaGuardada, setAperturaGuardada] = useState(null);
  const [arqueoId, setArqueoId] = useState(null);
  const [horaApertura, setHoraApertura] = useState(null);
  const [cerrado, setCerrado] = useState(false);

  // ============================================
  // MODAL DE APERTURA
  // ============================================

  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");

  // ============================================
  // CONTEO MANUAL
  // ============================================

  const [conteoCaja, setConteoCaja] = useState("");

  // ============================================
  // PAGINACIÓN
  // ============================================

  const [currentPageVentas, setCurrentPageVentas] = useState(1);
  const [currentPageGastos, setCurrentPageGastos] = useState(1);

  // ============================================
  // OBTENER TOKEN
  // ============================================

  const getToken = () => {
    try {
      const session = JSON.parse(
        localStorage.getItem("brasa.session") || "{}"
      );

      return session.token || null;
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      return null;
    }
  };

  // ============================================
  // CARGAR ARQUEO
  // ============================================

  const cargarArqueo = async () => {
    try {
      setLoading(true);

      const token = getToken();

      // ============================================
      // 1. CARGAR VENTAS
      // ============================================

      const ventasData = await fetchAllSales(token, {});

      const ventasFiltradas = ventasData.filter(
        (v) =>
          v.created_at &&
          v.created_at.split("T")[0] === fecha &&
          v.cancelada !== true
      );

      setVentas(ventasFiltradas);

      // ============================================
      // 2. CARGAR GASTOS
      // ============================================

      const gastosData = await fetchGastos(token, {});

      const gastosFiltrados = gastosData.filter(
        (g) => g.fecha && g.fecha === fecha
      );

      setGastos(gastosFiltrados);

      // ============================================
      // 3. CARGAR ARQUEO
      // ============================================

      const respuestaArqueo = await fetchArqueo(token, fecha);

      console.log("Respuesta del arqueo:", respuestaArqueo);

      const arqueo = Array.isArray(respuestaArqueo)
        ? respuestaArqueo.length > 0
          ? respuestaArqueo[0]
          : null
        : respuestaArqueo;

      console.log("Arqueo seleccionado:", arqueo);

      // ============================================
      // 4. SI EXISTE APERTURA
      // ============================================

      if (arqueo) {
        console.log("Apertura encontrada:", arqueo.apertura);
        console.log("ID del arqueo:", arqueo.id);

        setAperturaGuardada(
          arqueo.apertura !== null &&
          arqueo.apertura !== undefined
            ? Number(arqueo.apertura)
            : 0
        );

        setArqueoId(arqueo.id || null);

        setHoraApertura(arqueo.hora_apertura || null);

        // 👇 NUEVO: determinar si la caja ya fue cerrada
        const yaCerrada =
          arqueo.conteo !== null &&
          arqueo.conteo !== undefined;

        setCerrado(yaCerrada);

        // Si ya existe conteo guardado
        if (yaCerrada) {
          setConteoCaja(arqueo.conteo.toString());
        } else {
          setConteoCaja("");
        }
      } else {
        // ============================================
        // NO EXISTE APERTURA
        // ============================================

        console.log("No existe arqueo para la fecha:", fecha);

        setAperturaGuardada(null);
        setArqueoId(null);
        setHoraApertura(null);
        setConteoCaja("");
        setCerrado(false);
      }

      setUltimaActualizacion(
        new Date().toLocaleString("es-CO", {
          timeZone: "America/Bogota",
        })
      );
    } catch (error) {
      console.error("Error al cargar arqueo:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CARGAR CUANDO CAMBIA LA FECHA
  // ============================================

  useEffect(() => {
    cargarArqueo();
  }, [fecha]);

  // ============================================
  // GUARDAR APERTURA
  // ============================================

  const handleGuardarApertura = async () => {
    const monto = parseFloat(montoApertura);

    if (!monto || monto <= 0) {
      return Swal.fire({
        icon: "warning",
        title: "Monto inválido",
        text: "Ingresa un monto válido.",
      });
    }

    try {
      setLoading(true);

      const token = getToken();

      const ahora = new Date().toLocaleString("en-CA", {
        timeZone: "America/Bogota",
      });

      const horaActual =
        ahora.split(" ")[1] || "08:00:00";

      const usuario =
        JSON.parse(
          localStorage.getItem("user") || "{}"
        ).username || "Admin";

      await createAperturaCaja(token, {
        fecha,
        apertura: monto,
        hora_apertura: horaActual,
        usuario,
      });

      // Cerrar modal
      setShowAperturaModal(false);

      // Limpiar campo
      setMontoApertura("");

      // Recargar desde BD
      await cargarArqueo();

      Swal.fire({
        icon: "success",
        title: "Caja abierta",
        text: `Apertura: $${monto.toLocaleString(
          "es-CO"
        )} a las ${horaActual}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Error al guardar apertura:",
        error
      );

      if (
        error.message &&
        error.message.includes("Ya existe una apertura")
      ) {
        Swal.fire({
          icon: "info",
          title: "Caja ya abierta",
          text: "Ya existe una apertura para esta fecha. Se cargarán los datos guardados.",
        });

        await cargarArqueo();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }

      setShowAperturaModal(false);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CÁLCULOS
  // ============================================

  const totalVentas = ventas.reduce(
    (sum, v) => sum + (Number(v.total) || 0),
    0
  );

  const totalGastos = gastos.reduce(
    (sum, g) => sum + (Number(g.valor) || 0),
    0
  );

  const saldoOperativo =
    totalVentas - totalGastos;

  const aperturaNum =
    Number(aperturaGuardada) || 0;

  const conteoNum =
    Number(conteoCaja) || 0;

  const valorEsperado =
    aperturaNum + saldoOperativo;

  const diferencia =
    conteoNum - valorEsperado;

  // ============================================
  // RESULTADO DEL ARQUEO
  // ============================================

  let mensajeResultado = "";
  let claseResultado = "";

  if (conteoCaja !== "") {
    if (diferencia === 0) {
      mensajeResultado = "✅ Perfecto";
      claseResultado = "resultado-perfecto";
    } else if (diferencia < 0) {
      mensajeResultado = `❌ Faltan $${Math.abs(
        diferencia
      ).toLocaleString("es-CO")}`;

      claseResultado = "resultado-faltante";
    } else {
      mensajeResultado = `🚨 Sobran $${diferencia.toLocaleString(
        "es-CO"
      )}`;

      claseResultado = "resultado-sobrante";
    }
  }

  // ============================================
  // GUARDAR CIERRE
  // ============================================

  const handleGuardarCierre = async () => {
    if (!arqueoId) {
      return Swal.fire({
        icon: "warning",
        title: "Sin apertura",
        text: "Debes abrir la caja primero.",
      });
    }

    if (cerrado) {
      return Swal.fire({
        icon: "info",
        title: "Caja ya cerrada",
        text: "Esta caja ya fue cerrada para esta fecha.",
      });
    }

    if (conteoCaja === "") {
      return Swal.fire({
        icon: "warning",
        title: "Conteo requerido",
        text: "Debes ingresar el dinero contado en caja.",
      });
    }

    const conteoNumCierre =
      Number(conteoCaja) || 0;

    try {
      setLoading(true);

      const token = getToken();

      const usuario =
        JSON.parse(
          localStorage.getItem("user") || "{}"
        ).username || "Admin";

      await updateCierreCaja(
        token,
        arqueoId,
        {
          conteo: conteoNumCierre,
          valorEsperado,
          diferencia,
          usuario,
        }
      );

      await cargarArqueo();

      Swal.fire({
        icon: "success",
        title: "Cierre guardado",
        text: "El arqueo ha sido registrado exitosamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Error al guardar cierre:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔥 NUEVO: REABRIR CAJA (Permite corregir el cierre)
  // ============================================

  const handleReabrirCaja = async () => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Reabrir la caja?",
      text: "Esto borrará el conteo guardado para que puedas volver a cerrarla correctamente.",
      showCancelButton: true,
      confirmButtonText: "Sí, reabrir",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const token = getToken();

      await reabrirCaja(token, arqueoId);

      await cargarArqueo();

      Swal.fire({
        icon: "success",
        title: "Caja reabierta",
        text: "Ya puedes corregir el conteo y cerrar de nuevo.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al reabrir caja:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FORMATEAR HORA
  // ============================================

  const formatHora = (horaStr) => {
    if (!horaStr) {
      return "Inicio del día";
    }

    return horaStr.substring(0, 5);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="arqueo-container">

      {/* ============================================
          HEADER
      ============================================ */}

      <div className="arqueo-header">

        <h1 className="arqueo-title">
          Arqueo de Caja
        </h1>

        {loading && (
          <span className="loading-spinner">
            Cargando...
          </span>
        )}

        {!aperturaGuardada && (
          <button
            className="btn-abrir-caja"
            onClick={() =>
              setShowAperturaModal(true)
            }
            disabled={loading}
          >
            <Plus size={18} />
            Abrir Caja
          </button>
        )}

      </div>

      {/* ============================================
          CONTROLES
      ============================================ */}

      <div className="arqueo-controls">

        <div className="arqueo-fecha">

          <Calendar size={18} />

          <input
            type="date"
            value={fecha}
            onChange={(e) =>
              setFecha(e.target.value)
            }
            className="arqueo-input-fecha"
            disabled={loading}
          />

        </div>

        <button
          className="btn-consultar"
          onClick={cargarArqueo}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={
              loading ? "spin" : ""
            }
          />

          Consultar Arqueo
        </button>

      </div>

      {/* ============================================
          CUADRO DE CIERRE
      ============================================ */}

      <div className="arqueo-cuadro">

        <h2 className="arqueo-cuadro-titulo">
          Cierre de Caja
        </h2>

        <div className="arqueo-fila">

          <span className="arqueo-etiqueta">
            Apertura de caja:
          </span>

          <span className="arqueo-valor">
            $
            {aperturaNum.toLocaleString("es-CO")}
          </span>

        </div>

        <div className="arqueo-fila">

          <span className="arqueo-etiqueta">
            Conteo de caja:
          </span>

          <input
            type="number"
            className="arqueo-input-manual"
            placeholder="$0"
            value={conteoCaja}
            onChange={(e) =>
              setConteoCaja(e.target.value)
            }
            disabled={loading || cerrado}
          />

        </div>

        <div className="arqueo-fila arqueo-automatico">

          <span className="arqueo-etiqueta">
            Valor esperado de caja:
          </span>

          <span className="arqueo-valor">
            $
            {valorEsperado.toLocaleString("es-CO")}
          </span>

        </div>

        {mensajeResultado && (
          <div
            className={`arqueo-fila arqueo-resultado ${claseResultado}`}
          >

            <span className="arqueo-etiqueta">
              Diferencia:
            </span>

            <span className="arqueo-mensaje">
              {mensajeResultado}
            </span>

          </div>
        )}

        {aperturaGuardada !== null && !cerrado && (
          <button
            className="btn-guardar-cierre"
            onClick={handleGuardarCierre}
            disabled={loading}
          >
            <Save size={16} />
            Cerrar Caja
          </button>
        )}

        {cerrado && (
          <div className="arqueo-cerrada-badge">
            ✅ Caja cerrada para esta fecha
          </div>
        )}

        {/* 🔥 BOTÓN PARA REABRIR LA CAJA */}
        {cerrado && (
          <button
            className="btn-reabrir-caja"
            onClick={handleReabrirCaja}
            disabled={loading}
          >
            Reabrir caja (corregir cierre)
          </button>
        )}

      </div>

      {/* ============================================
          INFORMACIÓN
      ============================================ */}

      <div className="arqueo-info">

        <span>
          Fecha de última ejecución:{" "}
          {ultimaActualizacion || "---"}
        </span>

        <span>
          Hora desde:{" "}
          {formatHora(horaApertura)}
        </span>

        <span>
          Diferencia:{" "}
          {conteoCaja !== ""
            ? diferencia === 0
              ? "$0"
              : `$${diferencia.toLocaleString(
                  "es-CO"
                )}`
            : "---"}
        </span>

      </div>

      {/* ============================================
          TABLA DE VENTAS
      ============================================ */}

      <div className="arqueo-seccion">

        <h2 className="arqueo-seccion-titulo">
          Ventas del día
        </h2>

        <div className="arqueo-table-wrapper">

          <table className="arqueo-table">

            <thead>
              <tr>
                <th>Factura</th>
                <th>Hora</th>
                <th>Mesa</th>
                <th>Total</th>
                <th>Forma de pago</th>
                <th>Usuario</th>
              </tr>
            </thead>

            <tbody>

              {ventas.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="arqueo-empty"
                  >
                    No hay ventas para esta fecha.
                  </td>
                </tr>

              ) : (

                ventas
                  .slice(
                    (currentPageVentas - 1) *
                      ITEMS_PER_PAGE,
                    (currentPageVentas - 1) *
                      ITEMS_PER_PAGE +
                      ITEMS_PER_PAGE
                  )
                  .map((v) => (

                    <tr key={v.id}>

                      <td>
                        {v.numero_factura || "--"}
                      </td>

                      <td>
                        {new Date(
                          v.created_at
                        ).toLocaleTimeString(
                          "es-CO"
                        )}
                      </td>

                      <td>
                        {v.table_number === 1 ||
                        v.table_number === 2 ||
                        v.table_number === 3 ||
                        v.table_number === 4
                          ? `Mesa ${v.table_number}`
                          : "Caja"}
                      </td>

                      <td>
                        $
                        {Number(v.total || 0).toLocaleString(
                          "es-CO"
                        )}
                      </td>

                      <td>
                        <span
                          className={`estado-badge ${
                            v.forma_pago || ""
                          }`}
                        >
                          {v.forma_pago || "--"}
                        </span>
                      </td>

                      <td>
                        {v.created_by || "--"}
                      </td>

                    </tr>

                  ))

              )}

            </tbody>

          </table>

          <Paginador
            totalItems={ventas.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPageVentas}
            onPageChange={setCurrentPageVentas}
          />

        </div>

      </div>

      {/* ============================================
          TABLA DE GASTOS
      ============================================ */}

      <div className="arqueo-seccion">

        <h2 className="arqueo-seccion-titulo">
          Gastos del día
        </h2>

        <div className="arqueo-table-wrapper">

          <table className="arqueo-table">

            <thead>

              <tr>
                <th>Descripción</th>
                <th>Hora</th>
                <th>Valor</th>
                <th>Forma de pago</th>
                <th>Usuario</th>
              </tr>

            </thead>

            <tbody>

              {gastos.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="arqueo-empty"
                  >
                    No hay gastos para esta fecha.
                  </td>

                </tr>

              ) : (

                gastos
                  .slice(
                    (currentPageGastos - 1) *
                      ITEMS_PER_PAGE,
                    (currentPageGastos - 1) *
                      ITEMS_PER_PAGE +
                      ITEMS_PER_PAGE
                  )
                  .map((g) => (

                    <tr key={g.id}>

                      <td>
                        {g.descripcion}
                      </td>

                      <td>
                        {new Date(
                          g.created_at
                        ).toLocaleTimeString(
                          "es-CO"
                        )}
                      </td>

                      <td>
                        $
                        {Number(g.valor || 0).toLocaleString(
                          "es-CO"
                        )}
                      </td>

                      <td>
                        <span
                          className={`estado-badge ${
                            g.forma_pago || ""
                          }`}
                        >
                          {g.forma_pago || "--"}
                        </span>
                      </td>

                      <td>
                        {g.usuario || "--"}
                      </td>

                    </tr>

                  ))

              )}

            </tbody>

          </table>

          <Paginador
            totalItems={gastos.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPageGastos}
            onPageChange={setCurrentPageGastos}
          />

        </div>

      </div>

      {/* ============================================
          MODAL DE APERTURA
      ============================================ */}

      {showAperturaModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            !loading &&
            setShowAperturaModal(false)
          }
        >

          <div
            className="modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Abrir Caja
              </h2>

              <button
                className="modal-close"
                onClick={() =>
                  setShowAperturaModal(false)
                }
                disabled={loading}
              >
                <X size={20} />
              </button>

            </div>

            <div className="modal-body">

              <div className="form-group">

                <label>
                  Monto de apertura ($)
                </label>

                <input
                  type="number"
                  className="form-input"
                  value={montoApertura}
                  onChange={(e) =>
                    setMontoApertura(
                      e.target.value
                    )
                  }
                  placeholder="Ej: 100000"
                  disabled={loading}
                />

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn-cancelar"
                onClick={() =>
                  setShowAperturaModal(false)
                }
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                className="btn-guardar"
                onClick={handleGuardarApertura}
                disabled={loading}
              >
                <Save size={16} />
                Iniciar Caja
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}