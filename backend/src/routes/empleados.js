const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// 📥 OBTENER TODOS LOS EMPLEADOS
// ============================================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, nombre, cedula, telefono, direccion, fecha_nacimiento, correo, 
        numero_cuenta, eps, pension, cesantias, fecha_inicio, tipo_contrato, 
        contacto_emergencia, parentesco, telefono_emergencia
      FROM empleados 
      ORDER BY nombre ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /empleados:", err);
    res.status(500).json({ error: "Error al cargar empleados." });
  }
});

// ============================================
// ➕ CREAR EMPLEADO
// ============================================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    nombre, cedula, telefono, direccion, fecha_nacimiento, correo, numero_cuenta,
    eps, pension, cesantias, fecha_inicio, tipo_contrato, contacto_emergencia, parentesco, telefono_emergencia
  } = req.body;

  if (!nombre || !cedula || !fecha_inicio) {
    return res.status(400).json({ error: "Nombre, cédula y fecha de inicio son obligatorios." });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO empleados (
        nombre, cedula, telefono, direccion, fecha_nacimiento, correo, numero_cuenta,
        eps, pension, cesantias, fecha_inicio, tipo_contrato, contacto_emergencia, parentesco, telefono_emergencia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, nombre, cedula
    `, [
      nombre, cedula, telefono || null, direccion || null, fecha_nacimiento || null, correo || null, numero_cuenta || null,
      eps || null, pension || null, cesantias || null, fecha_inicio, tipo_contrato || null, contacto_emergencia || null,
      parentesco || null, telefono_emergencia || null
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /empleados:", err);
    res.status(500).json({ error: "Error al crear empleado." });
  }
});

// ============================================
// ✏️ ACTUALIZAR EMPLEADO
// ============================================
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    nombre, cedula, telefono, direccion, fecha_nacimiento, correo, numero_cuenta,
    eps, pension, cesantias, fecha_inicio, tipo_contrato, contacto_emergencia, parentesco, telefono_emergencia
  } = req.body;

  if (!nombre || !cedula || !fecha_inicio) {
    return res.status(400).json({ error: "Nombre, cédula y fecha de inicio son obligatorios." });
  }

  try {
    const { rows } = await pool.query(`
      UPDATE empleados SET
        nombre = $1, cedula = $2, telefono = $3, direccion = $4, fecha_nacimiento = $5,
        correo = $6, numero_cuenta = $7, eps = $8, pension = $9, cesantias = $10,
        fecha_inicio = $11, tipo_contrato = $12, contacto_emergencia = $13, parentesco = $14, telefono_emergencia = $15,
        updated_at = NOW()
      WHERE id = $16
      RETURNING id, nombre, cedula
    `, [
      nombre, cedula, telefono, direccion, fecha_nacimiento, correo, numero_cuenta,
      eps, pension, cesantias, fecha_inicio, tipo_contrato, contacto_emergencia, parentesco, telefono_emergencia, id
    ]);
    if (rows.length === 0) return res.status(404).json({ error: "Empleado no encontrado." });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en PUT /empleados/:id:", err);
    res.status(500).json({ error: "Error al actualizar empleado." });
  }
});

// ============================================
// 🗑️ ELIMINAR EMPLEADO
// ============================================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM empleados WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Empleado no encontrado." });
    res.json({ message: "Empleado eliminado correctamente." });
  } catch (err) {
    console.error("Error en DELETE /empleados/:id:", err);
    res.status(500).json({ error: "Error al eliminar empleado." });
  }
});

// ============================================
// 📋 RUTAS DE VACACIONES
// ============================================

// Obtener historial de vacaciones de un empleado
router.get("/:id/vacaciones", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT id, fecha_desde, fecha_hasta, dias_tomados
      FROM vacaciones_historial
      WHERE empleado_id = $1
      ORDER BY fecha_desde DESC
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /empleados/:id/vacaciones:", err);
    res.status(500).json({ error: "Error al cargar vacaciones." });
  }
});

// Registrar un nuevo periodo de vacaciones
router.post("/:id/vacaciones", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { fechaDesde, fechaHasta } = req.body;

  if (!fechaDesde || !fechaHasta) {
    return res.status(400).json({ error: "Fechas de inicio y fin son obligatorias." });
  }

  if (new Date(fechaHasta) < new Date(fechaDesde)) {
    return res.status(400).json({ error: "La fecha hasta no puede ser anterior a la fecha desde." });
  }

  // Calcular días hábiles aproximados (excluyendo fines de semana)
  const diffTime = Math.abs(new Date(fechaHasta) - new Date(fechaDesde));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let diasHabiles = 0;
  let currentDate = new Date(fechaDesde);
  while (currentDate <= new Date(fechaHasta)) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) diasHabiles++;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO vacaciones_historial (empleado_id, fecha_desde, fecha_hasta, dias_tomados)
      VALUES ($1, $2, $3, $4)
      RETURNING id, fecha_desde, fecha_hasta, dias_tomados
    `, [id, fechaDesde, fechaHasta, diasHabiles]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error en POST /empleados/:id/vacaciones:", err);
    res.status(500).json({ error: "Error al registrar vacaciones." });
  }
});

// Eliminar un registro de vacaciones
router.delete("/:empleadoId/vacaciones/:vacacionId", requireAuth, requireAdmin, async (req, res) => {
  const { vacacionId } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM vacaciones_historial WHERE id = $1", [vacacionId]);
    if (rowCount === 0) return res.status(404).json({ error: "Registro de vacaciones no encontrado." });
    res.json({ message: "Vacaciones eliminadas correctamente." });
  } catch (err) {
    console.error("Error en DELETE /empleados/:id/vacaciones/:vacacionId:", err);
    res.status(500).json({ error: "Error al eliminar vacaciones." });
  }
});

module.exports = router;