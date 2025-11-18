// src/controllers/tiendaController.js
const fs = require('fs');
const path = require('path');
const Producto = require('../models/Producto');


Producto.init();
const uploadsDir = path.resolve(__dirname, '../../uploads/tienda');
fs.mkdirSync(uploadsDir, { recursive: true });


exports.crearProducto = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }
    const userId = req.user.id;

    const {
      nombre,
      precio,
      categoria,
      stock,
      ubicacion,
    } = req.body || {};

    if (typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ ok: false, error: 'nombre es obligatorio' });
    }

    const precioNum = parseFloat(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      return res.status(400).json({ ok: false, error: 'precio debe ser un número mayor a 0' });
    }

    let stockNum = 0;
    if (typeof stock !== 'undefined') {
      const s = parseInt(stock, 10);
      if (!Number.isInteger(s) || s < 0) {
        return res.status(400).json({ ok: false, error: 'stock debe ser un entero mayor o igual a 0' });
      }
      stockNum = s;
    }

    const categoriaClean = (typeof categoria === 'string' && categoria.trim() !== '') ? categoria.trim() : null;
    const ubicacionClean = (typeof ubicacion === 'string' && ubicacion.trim() !== '') ? ubicacion.trim() : null;

    let imagenurl = null;
    const imagenurlFromBody = req.body?.imagenurl;
    if (req.file) {
      imagenurl = `/uploads/tienda/${req.file.filename}`;
    } else if (typeof imagenurlFromBody === 'string' && imagenurlFromBody.trim() !== '') {
      imagenurl = imagenurlFromBody.trim();
    }

    try {
      const creado = await Producto.create({
        userId,
        nombre: nombre.trim(),
        imagenurl,
        precio: precioNum,
        categoria: categoriaClean,
        stock: stockNum,
        ubicacion: ubicacionClean,
      });

      return res.status(201).json({ ok: true, data: creado });
    } catch (dbErr) {
      // Si falló la BD y se subió archivo, intenta borrarlo
      if (req.file && req.file.path) {
        try { await fs.promises.unlink(req.file.path); } catch (_) {}
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

// Productos aprobados
exports.listarProductosPublicos = async (_req, res, next) => {
  try {
    const rows = await Producto.findByStatus('approved');
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};


// Listado de productos del usuario logueado
exports.listarProductosUsuario = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }
    const rows = await Producto.findByUser(req.user.id);
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Obtener detalle  de un producto (solo aprobado)
exports.obtenerProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id inválido' });
    }

    const row = await Producto.getById(id);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });

    if (row.status !== 'approved') {
      return res.status(404).json({ ok: false, error: 'No encontrado' });
    }

    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

// Editar producto (usuario del producto o admin)
exports.editarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id inválido' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    const actual = await Producto.getById(id);
    if (!actual) return res.status(404).json({ ok: false, error: 'No encontrado' });

    const isOwner = actual.userId === req.user.id;
    const isAdmin = req.user.rol === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, error: 'Sin permisos para editar este producto' });
    }

    const {
      nombre,
      precio,
      categoria,
      stock,
      ubicacion,
      status, 
    } = req.body || {};

    
    let imagenurl = actual.imagenurl;
    const imagenurlFromBody = req.body?.imagenurl;
    if (req.file) {
      
      if (actual.imagenurl && typeof actual.imagenurl === 'string' && actual.imagenurl.startsWith('/uploads/tienda/')) {
        const oldPath = path.resolve(__dirname, '../../', actual.imagenurl.replace(/^\//, ''));
        try { await fs.promises.unlink(oldPath); } catch (_) {}
      }
      imagenurl = `/uploads/tienda/${req.file.filename}`;
    } else if (typeof imagenurlFromBody === 'string' && imagenurlFromBody.trim() !== '') {
      imagenurl = imagenurlFromBody.trim();
    }

    
    const nuevoNombre    = (typeof nombre === 'string'    && nombre.trim()    !== '') ? nombre.trim()    : actual.nombre;
    const nuevaCategoria = (typeof categoria === 'string' && categoria.trim() !== '') ? categoria.trim() : actual.categoria;
    const nuevaUbicacion = (typeof ubicacion === 'string' && ubicacion.trim() !== '') ? ubicacion.trim() : actual.ubicacion;

    
    let nuevoPrecio = actual.precio;
    if (typeof precio !== 'undefined') {
      const p = parseFloat(precio);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ ok: false, error: 'precio debe ser un número mayor a 0' });
      }
      nuevoPrecio = p;
    }

    
    let nuevoStock = actual.stock;
    if (typeof stock !== 'undefined') {
      const s = parseInt(stock, 10);
      if (!Number.isInteger(s) || s < 0) {
        return res.status(400).json({ ok: false, error: 'stock debe ser un entero mayor o igual a 0' });
      }
      nuevoStock = s;
    }

    let nuevoStatus = actual.status;
    if (typeof status === 'string' && status.trim() !== '' && isAdmin) {
      const st = status.trim();
      const allowed = ['pending', 'approved', 'rejected'];
      if (!allowed.includes(st)) {
        return res.status(400).json({ ok: false, error: 'status inválido' });
      }
      nuevoStatus = st;
    }

    const actualizado = await Producto.updateById(id, {
      nombre: nuevoNombre,
      imagenurl,
      precio: nuevoPrecio,
      categoria: nuevaCategoria,
      stock: nuevoStock,
      ubicacion: nuevaUbicacion,
      status: nuevoStatus,
    });

    if (!actualizado) {
      return res.status(500).json({ ok: false, error: 'No se pudo actualizar el producto' });
    }

    const row = await Producto.getById(id);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

// Eliminar producto (usuario del producto o admin)
exports.eliminarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id inválido' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    const row = await Producto.getById(id);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });

    const isOwner = row.userId === req.user.id;
    const isAdmin = req.user.rol === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, error: 'Sin permisos para eliminar este producto' });
    }

    // Borrar imagen si es local
    if (row.imagenurl && typeof row.imagenurl === 'string' && row.imagenurl.startsWith('/uploads/tienda/')) {
      const absPath = path.resolve(__dirname, '../../', row.imagenurl.replace(/^\//, ''));
      try { await fs.promises.unlink(absPath); } catch (_) {}
    }

    const deleted = await Producto.deleteById(id);
    if (!deleted) {
      return res.status(500).json({ ok: false, error: 'No se pudo eliminar el producto' });
    }

    res.json({ ok: true, data: { id, deleted: true } });
  } catch (err) {
    next(err);
  }
};

// lista para moderación 
exports.listarProductosModeracion = async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending').toLowerCase();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'status inválido' });
    }

    const rows = await Producto.findByStatus(status);
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};


// cambiar status (admin)
exports.cambiarStatusProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id inválido' });
    }

    let nuevoStatus = "approved";

    if (req.body?.status) {
      const st = req.body.status.trim();
      const allowed = ['pending', 'approved', 'rejected'];
      if (!allowed.includes(st)) {
        return res.status(400).json({ ok: false, error: 'status inválido' });
      }
      nuevoStatus = st;
    }

    const ok = await Producto.updateStatus(id, nuevoStatus);
    if (!ok) return res.status(404).json({ ok: false, error: 'No encontrado' });

    const row = await Producto.getById(id);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

