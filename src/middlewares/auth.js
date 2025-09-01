require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    const tokenFromCookie = req.cookies && req.cookies.token;
    const bearer = req.headers['authorization'];
    const tokenFromHeader = bearer && bearer.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) return res.status(401).json({ message: 'No autorizado (token faltante)' });

    const decoded = jwt.verify(token, JWT_SECRET);

    db.get(
      'SELECT id, nombre, apellidos, email, rol, isActive FROM users WHERE id = ?',
      [decoded.id],
      (err, user) => {
        if (err) {
          console.error('DB error en auth middleware:', err);
          return res.status(500).json({ message: 'Error interno' });
        }
        if (!user) return res.status(401).json({ message: 'Usuario no existe' });

        req.user = {
          id: user.id,
          nombre: user.nombre,
          apellidos: user.apellidos,
          email: user.email,
          rol: user.rol,
          isActive: user.isActive
        };
        next();
      }
    );
  } catch (err) {
    console.error('Auth error:', err.message || err);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
