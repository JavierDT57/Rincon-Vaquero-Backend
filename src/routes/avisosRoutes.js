// src/routes/avisosRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { crearAviso, listarAvisos, obtenerAviso, eliminarAviso, editarAviso } = require('../controllers/avisosController');
const requireAdmin = require('../middlewares/requireAdmin');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// asegurar carpeta destino
const dest = path.resolve(__dirname, '../../uploads/avisos');
fs.mkdirSync(dest, { recursive: true });

// Multer (almacenamiento local)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(12).toString('hex');
    cb(null, `${name}${ext}`);
  }
});
function fileFilter(_req, file, cb) {
  const allowed = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Solo imágenes (png, jpg, webp, gif)'), false);
  cb(null, true);
}
// ⬆️ límite a 15 MB 
const upload = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });

// Rutas:
router.get('/', listarAvisos);                                              // GET    /api/avisos
router.get('/:id', obtenerAviso);                                           // GET    /api/avisos/:id
router.post('/', requireAdmin, upload.single('imagen'), crearAviso);        // POST   /api/avisos
router.put('/:id', requireAdmin, upload.single('imagen'), editarAviso);     // PUT    /api/avisos/:id
router.delete('/:id', requireAdmin, eliminarAviso);                         // DELETE /api/avisos/:id

module.exports = router;
