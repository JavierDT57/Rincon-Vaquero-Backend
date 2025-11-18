const fs = require('fs');
const path = require('path');
const Producto = require('../models/Producto');

Producto.init();
const uploadsDir = path.resolve(__dirname, '../../uploads/tienda');
fs.mkdirSync(uploadsDir, { recursive: true });


function validarTelefono(telefono) {
  if (!telefono) return null;

  const clean = telefono.trim();

  const regex = /^\+[0-9]{1,3}[0-9\s]{6,14}$/;

  if (!regex.test(clean)) return null;

  return clean;
}


// ========================
// CREAR PRODUCTO
// ========================
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
      telefono,
    } = req.body || {};

    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
      return res.status(400).json({ ok: false, error: "nombre es obligatorio" });
    }

    const precioNum = parseFloat(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      return res.status(400).json({ ok: false, error: "precio inválido" });
    }

    let stockNum = 0;
    if (stock !== undefined) {
      const s = parseInt(stock, 10);
      if (!Number.isInteger(s) || s < 0) {
        return res.status(400).json({ ok: false, error: "stock inválido" });
      }
      stockNum = s;
    }

    const categoriaClean = categoria?.trim() || null;
    const ubicacionClean = ubicacion?.trim() || null;
    const telefonoClean = validarTelefono(telefono);

    if (telefono && !telefonoClean) {
      return res.status(400).json({ ok: false, error: "telefono debe ser internacional. Ej: +522221234567" });
    }

    let imagenurl = null;
    if (req.file) {
      imagenurl = `/uploads/tienda/${req.file.filename}`;
    } else if (req.body?.imagenurl && req.body.imagenurl.trim() !== "") {
      imagenurl = req.body.imagenurl.trim();
    }

    const creado = await Producto.create({
      userId,
      nombre: nombre.trim(),
      imagenurl,
      precio: precioNum,
      categoria: categoriaClean,
      stock: stockNum,
      ubicacion: ubicacionClean,
      telefono: telefonoClean,
    });

    return res.status(201).json({ ok: true, data: creado });
  } catch (err) {
    next(err);
  }
};


// ========================
// EDITAR PRODUCTO
// ========================
exports.editarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "id inválido" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: "No autenticado" });
    }

    const actual = await Producto.getById(id);
    if (!actual) return res.status(404).json({ ok: false, error: "No encontrado" });

    const isOwner = actual.userId === req.user.id;
    const isAdmin = req.user.rol === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    const {
      nombre,
      precio,
      categoria,
      stock,
      ubicacion,
      status,
      telefono,
    } = req.body || {};

    let imagenurl = actual.imagenurl;
    if (req.file) {
      if (
        actual.imagenurl &&
        actual.imagenurl.startsWith("/uploads/tienda/")
      ) {
        const oldPath = path.resolve(
          __dirname,
          "../../",
          actual.imagenurl.replace(/^\//, "")
        );
        try {
          await fs.promises.unlink(oldPath);
        } catch (_) {}
      }
      imagenurl = `/uploads/tienda/${req.file.filename}`;
    }

    const telefonoClean = validarTelefono(telefono);
    const nuevoTelefono = telefono ?
      (telefonoClean ? telefonoClean : null) :
      actual.telefono;

    if (telefono && !telefonoClean) {
      return res.status(400).json({
        ok: false,
        error: "telefono debe ser internacional. Ej: +522221234567"
      });
    }

    const nuevoNombre = nombre?.trim() || actual.nombre;
    const nuevaCategoria = categoria?.trim() || actual.categoria;
    const nuevaUbicacion = ubicacion?.trim() || actual.ubicacion;

    let nuevoPrecio = actual.precio;
    if (precio !== undefined) {
      const p = parseFloat(precio);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ ok: false, error: "precio inválido" });
      }
      nuevoPrecio = p;
    }

    let nuevoStock = actual.stock;
    if (stock !== undefined) {
      const s = parseInt(stock, 10);
      if (!Number.isInteger(s) || s < 0) {
        return res.status(400).json({ ok: false, error: "stock inválido" });
      }
      nuevoStock = s;
    }

    let nuevoStatus = actual.status;
    if (status && isAdmin) {
      const allowed = ["pending", "approved", "rejected"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ ok: false, error: "status inválido" });
      }
      nuevoStatus = status;
    }

    const actualizado = await Producto.updateById(id, {
      nombre: nuevoNombre,
      imagenurl,
      precio: nuevoPrecio,
      categoria: nuevaCategoria,
      stock: nuevoStock,
      ubicacion: nuevaUbicacion,
      telefono: nuevoTelefono,
      status: nuevoStatus,
    });

    if (!actualizado) {
      return res
        .status(500)
        .json({ ok: false, error: "No se pudo actualizar el producto" });
    }

    const row = await Producto.getById(id);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.listarProductosPublicos = async (_req, res, next) => {
  try {
    const rows = await Producto.findByStatus("approved");
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.listarProductosUsuario = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: "No autenticado" });
    }
    const rows = await Producto.findByUser(req.user.id);
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.obtenerProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "id inválido" });
    }

    const row = await Producto.getById(id);
    if (!row) return res.status(404).json({ ok: false, error: "No encontrado" });

    if (row.status !== "approved") {
      return res.status(404).json({ ok: false, error: "No encontrado" });
    }

    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.eliminarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "id inválido" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: "No autenticado" });
    }

    const row = await Producto.getById(id);
    if (!row) return res.status(404).json({ ok: false, error: "No encontrado" });

    const isOwner = row.userId === req.user.id;
    const isAdmin = req.user.rol === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    if (
      row.imagenurl &&
      row.imagenurl.startsWith("/uploads/tienda/")
    ) {
      const absPath = path.resolve(
        __dirname,
        "../../",
        row.imagenurl.replace(/^\//, "")
      );
      try { await fs.promises.unlink(absPath); } catch (_) {}
    }

    const deleted = await Producto.deleteById(id);
    if (!deleted) {
      return res.status(500).json({ ok: false, error: "No se pudo eliminar" });
    }

    res.json({ ok: true, data: { id, deleted: true } });
  } catch (err) {
    next(err);
  }
};

exports.listarProductosModeracion = async (req, res, next) => {
  try {
    const status = String(req.query.status || "pending").toLowerCase();
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, error: "status inválido" });
    }
    const rows = await Producto.findByStatus(status);
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.cambiarStatusProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "id inválido" });
    }

    let nuevoStatus = "approved";

    if (req.body?.status) {
      const st = req.body.status.trim();
      const allowed = ["pending", "approved", "rejected"];
      if (!allowed.includes(st)) {
        return res.status(400).json({ ok: false, error: "status inválido" });
      }
      nuevoStatus = st;
    }

    const ok = await Producto.updateStatus(id, nuevoStatus);
    if (!ok) return res.status(404).json({ ok: false, error: "No encontrado" });

    const row = await Producto.getById(id);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};
