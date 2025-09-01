require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cambialo_en_produccion';
const SALT_ROUNDS = 10;

// Registro de usuario
exports.register = (req, res) => {
  const { nombre, apellidos, email, password } = req.body;
  if (!nombre || !apellidos || !email || !password)
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ message: 'Error en la base de datos' });
    if (row) return res.status(409).json({ message: 'El correo ya está registrado.' });

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Error interno al hashear' });
      db.run(
        'INSERT INTO users (nombre, apellidos, email, passwordHash, rol, isActive) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellidos, email, hash, 'usuario', 1],
        function (err) {
          if (err) return res.status(500).json({ message: 'No se pudo crear el usuario' });
          const user = {
            id: this.lastID,
            nombre,
            apellidos,
            email,
            rol: 'usuario',
            isActive: 1
          };
          res.status(201).json({ message: 'Usuario creado', user });
        }
      );
    });
  });
};

// Crear admin (usa con Postman)
exports.createAdmin = (req, res) => {
  const { nombre, apellidos, email, password } = req.body;
  if (!nombre || !apellidos || !email || !password)
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ message: 'Error en la base de datos' });
    if (row) return res.status(409).json({ message: 'El correo ya está registrado.' });

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Error interno al hashear' });
      db.run(
        'INSERT INTO users (nombre, apellidos, email, passwordHash, rol, isActive) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellidos, email, hash, 'admin', 1],
        function (err) {
          if (err) return res.status(500).json({ message: 'No se pudo crear el admin' });
          const user = {
            id: this.lastID,
            nombre,
            apellidos,
            email,
            rol: 'admin',
            isActive: 1
          };
          res.status(201).json({ message: 'Admin creado', user });
        }
      );
    });
  });
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Correo y contraseña requeridos' });

  db.get(
    'SELECT id, nombre, apellidos, email, passwordHash, rol, isActive FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ message: 'Error en la base de datos' });
      }
      if (!user) return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
      if (!user.isActive) return res.status(403).json({ message: 'Usuario inactivo' });

      bcrypt.compare(password, user.passwordHash, (err, valid) => {
        if (err) return res.status(500).json({ message: 'Error interno' });
        if (!valid) return res.status(401).json({ message: 'Usuario o contraseña inválidos' });

        const payload = {
          id: user.id,
          email: user.email,
          rol: user.rol,
          nombre: user.nombre,
          apellidos: user.apellidos
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
          message: 'Login exitoso',
          user: {
            id: user.id,
            nombre: user.nombre,
            apellidos: user.apellidos,
            email: user.email,
            rol: user.rol
          }
        });
      });
    }
  );
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ message: 'Logout exitoso' });
};

// Ruta protegida /me
exports.me = (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  res.json({ user: req.user });
};

// Recuperar contraseña (stub)
exports.recoverPassword = (req, res) => {
  res.status(501).json({ message: 'Recuperación de contraseña no implementada aquí.' });
};
