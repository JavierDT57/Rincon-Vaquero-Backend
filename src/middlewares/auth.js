// middlewares/auth.js
const jwt = require("jsonwebtoken");

// Lee JWT de cookie "token" 
function getTokenFromReq(req) {
  if (req.cookies?.token) return req.cookies.token;
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return null;
}

exports.requireAuth = (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ ok: false, message: "No autenticado" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
   
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Sesión inválida o expirada" });
  }
};

exports.requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, message: "No autenticado" });
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ ok: false, message: "Sin permisos" });
    }
    next();
  };
};
