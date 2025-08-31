const bcrypt = require('bcrypt');
const User = require('../models/User');

// Registro de usuario normal 
exports.register = async (req, res) => {
  try {
    const { nombre, apellidos, email, password } = req.body;

    if (!nombre || !apellidos || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nombre,
      apellidos,
      email,
      passwordHash,
      rol: "usuario" // <--- cree solo usuarios
    });

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};

// Registro de Admin
exports.createAdmin = async (req, res) => {
  try {
    const { nombre, apellidos, email, password } = req.body;
    if (!nombre || !apellidos || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      nombre,
      apellidos,
      email,
      passwordHash,
      rol: "admin"
    });
    res.status(201).json({ mensaje: 'Admin registrado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error al registrar admin:', error); 
    res.status(500).json({ error: 'Error al registrar admin.', detalle: error.message });
  }
};

// Recuperar contrasena
exports.recoverPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Correo y nueva contraseña requeridos.' });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const updated = await User.updatePassword(email, newPasswordHash);
    if (!updated) {
      return res.status(500).json({ error: 'No se pudo actualizar la contraseña.' });
    }
    res.json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ error: 'Error en recuperación de contraseña.' });
  }
};



// Login 
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    res.json({
      mensaje: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error al registrar admin:', error); 
    res.status(500).json({ error: 'Error al registrar admin.', detalle: error.message });
  }
};
