// src/controllers/testimoniosController.js
const fs = require('fs');
const path = require('path');
const Testimonio = require('../models/Testimonio');

Testimonio.init();

const uploadsDir = path.resolve(__dirname, '../../uploads/testimonios');
fs.mkdirSync(uploadsDir, { recursive: true });

exports.crearTestimonio = async (req, res, next) => {
  try {
    const { comentario, fecha, imagenurl: imagenurlBody, localidad, nombre, rating } = req.body || {};

    if (!comentario || !localidad || !nombre || typeof rating === 'undefined') {
      return res.status(400).json({ ok: false, error: 'comentario, localidad, nombre y rating son obligatorios' });
    }

    const ratingInt = parseInt(rating, 10);
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ ok: false, error: 'rating debe ser un entero entre 1 y 5' });
    }

    let imagenurl = null;
    if (req.file) {
      imagenurl = `/uploads/testimonios/${req.file.filename}`; // vía form-data (campo: imagenurl)
    } else if (typeof imagenurlBody === 'string' && imagenurlBody.trim() !== '') {
      imagenurl = imagenurlBody.trim(); // vía JSON con URL existente (opcional)
    }

    // fecha: si no llega, usamos ahora en ISO
    let fechaFinal = new Date().toISOString();
    if (typeof fecha === 'string' && fecha.trim() !== '' && !Number.isNaN(Date.parse(fecha))) {
      fechaFinal = new Date(fecha).toISOString();
    }

    try {
      const creado = await Testimonio.create({
        comentario: String(comentario).trim(),
        fecha: fechaFinal,
        imagenurl,
        localidad: String(localidad).trim(),
        nombre: String(nombre).trim(),
        rating: ratingInt
      });
      return res.status(201).json({ ok: true, data: creado });
    } catch (dbErr) {
      if (req.file && req.file.path) { try { await fs.promises.unlink(req.file.path); } catch (_) {} }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

exports.listarTestimonios = async (_req, res, next) => {
  try {
    const rows = await Testimonio.getAll();
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.obtenerTestimonio = async (req, res, next) => {
  try {
    const row = await Testimonio.getById(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.eliminarTestimonio = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id inválido' });
    }

    const row = await Testimonio.getById(id);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });

    if (row.imagenurl && typeof row.imagenurl === 'string' && row.imagenurl.startsWith('/uploads/testimonios/')) {
      const absPath = path.resolve(__dirname, '../../', row.imagenurl.replace(/^\//, ''));
      try { await fs.promises.unlink(absPath); } catch (_) {}
    }

    const deleted = await Testimonio.deleteById(id);
    if (!deleted) return res.status(500).json({ ok: false, error: 'No se pudo borrar el testimonio' });

    res.json({ ok: true, data: { id, deleted: true } });
  } catch (err) {
    next(err);
  }
};

exports.editarTestimonio = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { comentario, localidad, nombre, rating, fecha, imagenurl: imagenurlFromBody } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const actual = await Testimonio.getById(id);
    if (!actual) return res.status(404).json({ ok: false, error: 'No encontrado' });

    // Mantener imagen actual salvo que llegue una nueva (archivo o URL)
    let imagenurl = actual.imagenurl;

    if (req.file) {
      // borrar anterior si era local
      if (actual.imagenurl && actual.imagenurl.startsWith('/uploads/testimonios/')) {
        const oldPath = path.resolve(__dirname, '../../', actual.imagenurl.replace(/^\//, ''));
        try { await fs.promises.unlink(oldPath); } catch (_) {}
      }
      imagenurl = `/uploads/testimonios/${req.file.filename}`;
    } else if (typeof imagenurlFromBody === 'string' && imagenurlFromBody.trim() !== '') {
      imagenurl = imagenurlFromBody.trim();
    }

    // Mantener valores si no se mandan
    const nuevoComentario = (typeof comentario === 'string' && comentario.trim() !== '') ? comentario.trim() : actual.comentario;
    const nuevaLocalidad  = (typeof localidad  === 'string' && localidad.trim()  !== '') ? localidad.trim()  : actual.localidad;
    const nuevoNombre     = (typeof nombre     === 'string' && nombre.trim()     !== '') ? nombre.trim()     : actual.nombre;

    let nuevoRating = actual.rating;
    if (typeof rating !== 'undefined') {
      const r = parseInt(rating, 10);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ ok: false, error: 'rating debe ser un entero entre 1 y 5' });
      }
      nuevoRating = r;
    }

    let nuevaFecha = actual.fecha;
    if (typeof fecha === 'string' && fecha.trim() !== '') {
      const d = new Date(fecha);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ ok: false, error: 'fecha inválida' });
      }
      nuevaFecha = d.toISOString();
    }

    const actualizado = await Testimonio.updateById(id, {
      comentario: nuevoComentario,
      fecha: nuevaFecha,
      imagenurl,
      localidad: nuevaLocalidad,
      nombre: nuevoNombre,
      rating: nuevoRating
    });

    if (!actualizado) {
      return res.status(500).json({ ok: false, error: 'No se pudo actualizar el testimonio' });
    }

    res.json({
      ok: true,
      data: {
        id,
        comentario: nuevoComentario,
        fecha: nuevaFecha,
        imagenurl,
        localidad: nuevaLocalidad,
        nombre: nuevoNombre,
        rating: nuevoRating
      }
    });
  } catch (err) {
    next(err);
  }
};
