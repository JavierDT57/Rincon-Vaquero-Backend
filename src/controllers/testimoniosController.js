// src/controllers/testimoniosController.js
const fs = require('fs');
const path = require('path');
const Testimonio = require('../models/Testimonio');
const { queueModeration } = require('../jobs/moderation');

Testimonio.init();

const uploadsDir = path.resolve(__dirname, '../../uploads/testimonios');
fs.mkdirSync(uploadsDir, { recursive: true });

// Crear (solo logueado) 
exports.crearTestimonio = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

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
      imagenurl = `/uploads/testimonios/${req.file.filename}`;
    } else if (typeof imagenurlBody === 'string' && imagenurlBody.trim() !== '') {
      imagenurl = imagenurlBody.trim();
    }

    let fechaFinal = new Date().toISOString();
    if (typeof fecha === 'string' && fecha.trim() !== '' && !Number.isNaN(Date.parse(fecha))) {
      fechaFinal = new Date(fecha).toISOString();
    }

    try {
      const { id } = await Testimonio.create({
        userId: req.user.id,
        comentario: String(comentario).trim(),
        fecha: fechaFinal,
        imagenurl,
        localidad: String(localidad).trim(),
        nombre: String(nombre).trim(),
        rating: Number(ratingInt),
        status: 'pending',
        analisis: null,   
        resumen: null     
      });

      const creado = await Testimonio.getById(id);

      // Encola moderación si hay imagen local
      if (creado?.imagenurl && creado.imagenurl.startsWith('/uploads/')) {
        queueModeration(id, creado.imagenurl);
      }

      return res.status(201).json({ ok: true, data: creado });
    } catch (dbErr) {
      if (req.file && req.file.path) { try { await fs.promises.unlink(req.file.path); } catch (_) {} }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

// Público: solo approved 
exports.listarTestimonios = async (_req, res, next) => {
  try {
    const rows = await Testimonio.findByStatus('approved');
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

// Editar contenido (solo admin, PUT)
exports.editarTestimonio = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { comentario, localidad, nombre, rating, fecha, imagenurl: imagenurlFromBody } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const actual = await Testimonio.getById(id);
    if (!actual) return res.status(404).json({ ok: false, error: 'No encontrado' });

    // Imagen
    let imagenurl = actual.imagenurl;
    if (req.file) {
      if (actual.imagenurl && actual.imagenurl.startsWith('/uploads/testimonios/')) {
        const oldPath = path.resolve(__dirname, '../../', actual.imagenurl.replace(/^\//, ''));
        try { await fs.promises.unlink(oldPath); } catch (_) {}
      }
      imagenurl = `/uploads/testimonios/${req.file.filename}`;
    } else if (typeof imagenurlFromBody === 'string' && imagenurlFromBody.trim() !== '') {
      imagenurl = imagenurlFromBody.trim();
    }

    // Textos
    const nuevoComentario = (typeof comentario === 'string' && comentario.trim() !== '') ? comentario.trim() : actual.comentario;
    const nuevaLocalidad  = (typeof localidad  === 'string' && localidad.trim()  !== '') ? localidad.trim()  : actual.localidad;
    const nuevoNombre     = (typeof nombre     === 'string' && nombre.trim()     !== '') ? nombre.trim()     : actual.nombre;

    // Rating
    let nuevoRating = actual.rating;
    if (typeof rating !== 'undefined') {
      const r = parseInt(rating, 10);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ ok: false, error: 'rating debe ser un entero entre 1 y 5' });
      }
      nuevoRating = r;
    }

    // Fecha
    let nuevaFecha = actual.fecha;
    if (typeof fecha === 'string' && fecha.trim() !== '') {
      const d = new Date(fecha);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ ok: false, error: 'fecha inválida' });
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

// ===== Moderación (solo admin) =====

// Listar por estado: pending | approved
exports.listarTestimoniosModeracion = async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending').toLowerCase();
    if (!['pending','approved'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'status inválido' });
    }
    const rows = await Testimonio.findByStatus(status);
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// Aprobar (PATCH)
exports.aprobarTestimonio = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const ok = await Testimonio.updateStatus(id, 'approved');
    if (!ok) return res.status(404).json({ ok: false, error: 'No encontrado' });

    const row = await Testimonio.getById(id);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};
// Devuelve el JSON guardado
exports.obtenerAnalisisAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const row = await Testimonio.getById(id);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });

    let parsed = null;
    if (typeof row.analisis === 'string' && row.analisis.trim() !== '') {
      try { parsed = JSON.parse(row.analisis); } catch (_) { parsed = row.analisis; }
    }
    res.json({ ok: true, data: { id: row.id, analisis: parsed } });
  } catch (err) { next(err); }
};

// Guarda el texto generado por Gemini
exports.guardarResumenAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { resumen } = req.body || {};
    if (typeof resumen !== 'string' || resumen.trim() === '') {
      return res.status(400).json({ ok: false, error: 'resumen requerido' });
    }
    const cleaned = resumen.trim().slice(0, 500);

    const ok = await Testimonio.updateById(id, { resumen: cleaned });
    if (!ok) return res.status(404).json({ ok: false, error: 'No encontrado' });

    const row = await Testimonio.getById(id);
    res.json({ ok: true, data: { id: row.id, resumen: row.resumen } });
  } catch (err) { next(err); }
};
