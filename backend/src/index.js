require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const salesRoutes = require("./routes/sales");
const inventoryRoutes = require("./routes/inventory"); 
const pedidosRoutes = require("./routes/pedidos");
const proveedoresRoutes = require("./routes/proveedores");
const clientesRoutes = require("./routes/clientes");
const cuentasPagarRoutes = require("./routes/cuentasPagar");
const gastosRoutes = require("./routes/gastos");
const empleadosRoutes = require("./routes/empleados");
const arqueoRoutes = require("./routes/arqueo");
const recipesRoutes = require("./routes/recipes"); // ✅ NUEVA

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "brasa-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes); 
app.use("/api/pedidos", pedidosRoutes); 
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/cuentas-pagar", cuentasPagarRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/empleados", empleadosRoutes);
app.use("/api/arqueo", arqueoRoutes);
app.use("/api/recipes", recipesRoutes); // ✅ NUEVA

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`brasa-backend escuchando en el puerto ${PORT}`);
});