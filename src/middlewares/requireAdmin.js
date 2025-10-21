// src/middlewares/requireAdmin.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  
  if (req.user) {
    if (req.user.rol === 'admin') return next();
    return res.status(403).json({ ok: false, message: 'Solo administradores' });
  }

  // Fallback
  try {
    const h = req.headers.authorization || '';
    const bearer = h.startsWith('Bearer ') ? h.slice(7) : null;
    const token = req.cookies?.token || bearer;
    if (!token) return res.status(401).json({ ok: false, message: 'No autenticado' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.rol !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Solo administradores' });
    }
    req.user = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ ok: false, message: 'Sesión inválida o expirada' });
  }
};
