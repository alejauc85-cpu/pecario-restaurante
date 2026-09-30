import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  fetchProveedoresList,
  createProveedor,
  fetchProductosProveedor,
  crearProductoParaProveedor,
} from "../../api";
import "./ProveedorProductoSelector.css";

export default function ProveedorProductoSelector({
  token,
  onSelectProveedor,
  onSelectProducto,
}) {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [proveedorId, setProveedorId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [codigoProveedor, setCodigoProveedor] = useState("");

  const [loading, setLoading] = useState(false);

  // ============================================
  // Cargar proveedores al montar
  // ============================================
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const provs = await fetchProveedoresList(token);
        setProveedores(provs || []);
      } catch (err) {
        console.error("Error cargando proveedores:", err);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  // ============================================
  // Cargar productos del proveedor seleccionado
  // ============================================
  useEffect(() => {
    async function loadProductos() {
      if (!proveedorId || proveedorId === "__nuevo__") {
        setProductos([]);
        setProductoId("");
        setCodigoProveedor("");
        return;
      }

      try {
        const data = await fetchProductosProveedor(token, proveedorId);
        setProductos(data || []);
      } catch (err) {
        console.error("Error cargando productos:", err);
        setProductos([]);
      }
    }

    loadProductos();
  }, [proveedorId, token]);

  // ============================================
  // Crear un proveedor nuevo
  // ============================================
  const handleNuevoProveedor = async () => {
    const { value: nombre } = await Swal.fire({
      title: "Nuevo proveedor",
      input: "text",
      inputLabel: "Nombre comercial",
      inputPlaceholder: "Ej: Postobón",
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef761f",
      cancelButtonColor: "#1a1a2e",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Escribe un nombre.";
        return null;
      },
    });

    if (!nombre) return;

    try {
      const nuevo = await createProveedor(token, {
        nombreComercial: nombre.trim(),
      });
      setProveedores((prev) => [...prev, nuevo]);
      setProveedorId(String(nuevo.id));

      if (onSelectProveedor) onSelectProveedor(nuevo);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ============================================
  // Crear un producto nuevo para el proveedor
  // ============================================
  const handleNuevoProducto = async () => {
    if (!proveedorId || proveedorId === "__nuevo__") {
      Swal.fire("Atención", "Selecciona un proveedor primero.", "warning");
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Nuevo producto para este proveedor",
      html: `
        <input id="swal-nombre" class="swal2-input" placeholder="Nombre del producto" />
        <input id="swal-codigo" class="swal2-input" placeholder="Código del proveedor (opcional)" />
        <input id="swal-precio" type="number" class="swal2-input" placeholder="Precio (opcional)" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef761f",
      cancelButtonColor: "#1a1a2e",
      preConfirm: () => {
        const nombre = document.getElementById("swal-nombre").value;
        const codigo = document.getElementById("swal-codigo").value;
        const precio = document.getElementById("swal-precio").value;

        if (!nombre || !nombre.trim()) {
          Swal.showValidationMessage("El nombre es obligatorio.");
          return false;
        }

        return {
          nombre: nombre.trim(),
          codigoProveedor: codigo.trim() || null,
          precio: precio ? parseFloat(precio) : null,
        };
      },
    });

    if (!formValues) return;

    try {
      const nuevo = await crearProductoParaProveedor(token, proveedorId, {
        nombre: formValues.nombre,
        codigoProveedor: formValues.codigoProveedor,
        precio: formValues.precio,
      });

      // Refrescar la lista
      const data = await fetchProductosProveedor(token, proveedorId);
      setProductos(data || []);
      setProductoId(String(nuevo.productoId));
      setCodigoProveedor(nuevo.codigoProveedor || "");

      if (onSelectProducto) {
        onSelectProducto({
          productoId: nuevo.productoId,
          nombre: nuevo.nombre,
          codigoProveedor: nuevo.codigoProveedor,
        });
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ============================================
  // Cambios en los selects
  // ============================================
  const handleProveedorChange = (e) => {
    const value = e.target.value;

    if (value === "__nuevo__") {
      setProveedorId("__nuevo__");
      setProductos([]);
      setProductoId("");
      setCodigoProveedor("");
      return;
    }

    setProveedorId(value);
    setProductoId("");
    setCodigoProveedor("");

    const prov = proveedores.find((p) => String(p.id) === value);
    if (onSelectProveedor) onSelectProveedor(prov || null);
  };

  const handleProductoChange = (e) => {
    const value = e.target.value;

    if (value === "__nuevo__") {
      setProductoId("__nuevo__");
      setCodigoProveedor("");
      return;
    }

    setProductoId(value);

    const prod = productos.find((p) => String(p.productoId) === value);
    setCodigoProveedor(prod?.codigoProveedor || "");

    if (onSelectProducto) onSelectProducto(prod || null);
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div className="prov-prod-selector">
      {/* SELECTOR DE PROVEEDOR */}
      <div className="form-group">
        <label>Proveedor</label>
        <select
          value={proveedorId}
          onChange={handleProveedorChange}
          className="form-input"
          disabled={loading}
        >
          <option value="">— Selecciona un proveedor —</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombreComercial}
            </option>
          ))}
          <option value="__nuevo__">➕ Ingresar nuevo proveedor…</option>
        </select>

        {proveedorId === "__nuevo__" && (
          <button
            type="button"
            className="btn-nuevo"
            onClick={handleNuevoProveedor}
          >
            Crear proveedor nuevo
          </button>
        )}
      </div>

      {/* SELECTOR DE PRODUCTO */}
      {proveedorId && proveedorId !== "__nuevo__" && (
        <div className="form-group">
          <label>Producto</label>

          {productos.length === 0 ? (
            <div className="sin-productos">
              <p>Este proveedor aún no tiene productos registrados.</p>
              <button
                type="button"
                className="btn-nuevo"
                onClick={handleNuevoProducto}
              >
                ➕ Ingresar primer producto
              </button>
            </div>
          ) : (
            <>
              <select
                value={productoId}
                onChange={handleProductoChange}
                className="form-input"
                disabled={loading}
              >
                <option value="">— Selecciona un producto —</option>
                {productos.map((p) => (
                  <option key={p.productoId} value={p.productoId}>
                    {p.nombre}
                    {p.codigoProveedor ? ` (${p.codigoProveedor})` : ""}
                  </option>
                ))}
                <option value="__nuevo__">➕ Ingresar nuevo producto…</option>
              </select>

              {productoId === "__nuevo__" && (
                <button
                  type="button"
                  className="btn-nuevo"
                  onClick={handleNuevoProducto}
                >
                  Crear producto para este proveedor
                </button>
              )}

              {codigoProveedor && (
                <small className="codigo-hint">
                  Código del proveedor: <strong>{codigoProveedor}</strong>
                </small>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}