// src/controllers/avisosController.js
const fs = require('fs');
const path = require('path');
const Aviso = require('../models/Aviso');

// crea tabla si no existe
Aviso.init();

// asegurar carpeta uploads/avisos
const uploadsDir = path.resolve(__dirname, '../../uploads/avisos');
fs.mkdirSync(uploadsDir, { recursive: true });

exports.crearAviso = async (req, res, next) => {
  try {
    const { titulo, texto, imgurl: imgurlFromBody } = req.body || {};
    if (!titulo || !texto) {
      return res.status(400).json({ ok: false, error: 'titulo y texto son obligatorios' });
    }

    let imgurl = null;
    // 1) Caso con archivo (form-data: imagen)
    if (req.file) {
      imgurl = `/uploads/avisos/${req.file.filename}`;
    }
    // 2) Caso JSON con imgurl (opcional)
    else if (typeof imgurlFromBody === 'string' && imgurlFromBody.trim() !== '') {
      imgurl = imgurlFromBody.trim();
    }

    const fecha = new Date().toISOString();

    try {
      const creado = await Aviso.create({
        titulo: String(titulo).trim(),
        texto: String(texto).trim(),
        imgurl,
        fecha
      });
      return res.status(201).json({ ok: true, data: creado });
    } catch (dbErr) {
      // Si falló la BD y habíamos subido archivo, bórralo
      if (req.file && req.file.path) {
        try { await fs.promises.unlink(req.file.path); } catch (_) {}
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};


exports.listarAvisos = async (_req, res, next) => {
  try {
    const rows = await Aviso.getAll();
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.obtenerAviso = async (req, res, next) => {
  try {
    const row = await Aviso.getById(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.eliminarAviso = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id inválido' });
    }

    // 1) Buscar el aviso para saber si tiene imagen
    const row = await Aviso.getById(id);
    if (!row) {
      return res.status(404).json({ ok: false, error: 'No encontrado' });
    }

    // 2) Si hay imagen local, intentar borrarla (no fallar si no existe)
    if (row.imgurl && typeof row.imgurl === 'string' && row.imgurl.startsWith('/uploads/avisos/')) {
      const absPath = path.resolve(__dirname, '../../', row.imgurl.replace(/^\//, ''));
      try { await fs.promises.unlink(absPath); } catch (_) {}
    }

    // 3) Borrar el registro en BD
    const deleted = await Aviso.deleteById(id);
    if (!deleted) {
      return res.status(500).json({ ok: false, error: 'No se pudo borrar el aviso' });
    }

    return res.json({ ok: true, data: { id, deleted: true } });
  } catch (err) {
    next(err);
  }
};

