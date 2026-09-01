const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Falta el token de autenticación." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

// ✅ AGREGAR ESTA FUNCIÓN
function requireAdmin(req, res, next) {
  // Verificar si el usuario existe y tiene rol de admin
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado." });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
  
  next();
}

// ✅ EXPORTAR AMBAS FUNCIONES
module.exports = { requireAuth, requireAdmin };