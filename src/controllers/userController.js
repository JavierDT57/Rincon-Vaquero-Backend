require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const User = require('../models/User');
const { sendWelcomeMail, sendPasswordResetMail } = require('../services/sendMail');

const JWT_SECRET = process.env.JWT_SECRET || 'cambialo_en_produccion';
const SALT_ROUNDS = 10;

// --- Política de contraseñas ---
function validatePassword(pwd) {
  if (typeof pwd !== 'string') {
    return { ok: false, message: 'Contraseña inválida.' };
  }
  const faltas = [];
  if (pwd.length < 8) faltas.push('al menos 8 caracteres');
  if (!/\d/.test(pwd)) faltas.push('al menos un número');
  if (!/[^\w\s]/.test(pwd)) faltas.push('al menos un símbolo (p. ej., !@#$%&*.)');
  if (/\s/.test(pwd)) faltas.push('sin espacios');

  if (faltas.length) {
    return { ok: false, message: `La contraseña no cumple: ${faltas.join(', ')}.` };
  }
  return { ok: true };
}


// Registro de usuario
exports.register = (req, res) => {
  const { nombre, apellidos, email, password } = req.body;
  if (!nombre || !apellidos || !email || !password)
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  
  const check = validatePassword(password);
  if (!check.ok) {
    return res.status(400).json({ message: check.message });
  }

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ message: 'Error en la base de datos' });
    if (row) return res.status(409).json({ message: 'El correo ya está registrado.' });

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Error interno al hashear' });
      db.run(
        'INSERT INTO users (nombre, apellidos, email, passwordHash, rol, isActive) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellidos, email, hash, 'usuario', 1],
        async function (err) {
          if (err) return res.status(500).json({ message: 'No se pudo crear el usuario' });
          const user = {
            id: this.lastID,
            nombre,
            apellidos,
            email,
            rol: 'usuario',
            isActive: 1
          };

          // --- Envío de correo de bienvenida ---
          try {
            await sendWelcomeMail({ to: email, nombre });
          } catch (e) {
            console.error('No se pudo enviar el correo de bienvenida:', e);
            // El registro sigue, solo se loguea el error
          }

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
  
  const check = validatePassword(password);
  if (!check.ok) {
    return res.status(400).json({ message: check.message });
  }

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
// 1) Solicitar token de recuperación
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, message: 'Email requerido' });

    const user = await User.findByEmail(email);
    
    const token = Math.random().toString().slice(2, 8); 
    const expiresAt = Date.now() + 15 * 60 * 1000; 

    if (user) {
      await User.setResetToken(email, token, expiresAt);
      await sendPasswordResetMail({ to: email, token });
    }

    return res.json({ ok: true, message: 'Si el correo existe, se envió un código de recuperación.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error solicitando recuperación' });
  }
};

// 2) Verificar token
exports.verifyPasswordToken = async (req, res) => {
  try {
    const { email, token } = req.body || {};
    if (!email || !token) return res.status(400).json({ ok: false, message: 'Email y token requeridos' });

    const user = await User.findByEmail(email);
    if (!user || !user.reset_token || !user.reset_expires) {
      return res.status(400).json({ ok: false, message: 'Token inválido o no solicitado' });
    }
    if (String(user.reset_token).trim() !== String(token).trim()) {
      return res.status(400).json({ ok: false, message: 'Token incorrecto' });
    }
    if (Date.now() > Number(user.reset_expires)) {
      return res.status(400).json({ ok: false, message: 'Token expirado' });
    }

    return res.json({ ok: true, message: 'Token válido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error verificando token' });
  }
};

// 3) Confirmar nueva contraseña
exports.confirmPasswordReset = async (req, res) => {
  try {
    const { email, token, newPassword, confirmPassword } = req.body || {};
    if (!email || !token || !newPassword || !confirmPassword) {
      return res.status(400).json({ ok: false, message: 'Campos requeridos faltantes' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ ok: false, message: 'Las contraseñas no coinciden' });
    }

    const check = validatePassword(newPassword);
    if (!check.ok) {
      return res.status(400).json({ ok: false, message: check.message });
    }

    const user = await User.findByEmail(email);
    if (!user || !user.reset_token || !user.reset_expires) {
      return res.status(400).json({ ok: false, message: 'Token inválido o no solicitado' });
    }
    if (String(user.reset_token).trim() !== String(token).trim()) {
      return res.status(400).json({ ok: false, message: 'Token incorrecto' });
    }
    if (Date.now() > Number(user.reset_expires)) {
      return res.status(400).json({ ok: false, message: 'Token expirado' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.updatePassword(email, hash);
    await User.clearResetToken(email);

    return res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error actualizando contraseña' });
  }
};


exports.adminOnly = (req, res) => {
  
  res.json({ message: 'Acceso admin OK', user: req.user });
};
