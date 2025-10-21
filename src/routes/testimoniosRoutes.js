// src/routes/testimoniosRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const {
  crearTestimonio,
  listarTestimonios,
  obtenerTestimonio,
  editarTestimonio,
  eliminarTestimonio
} = require('../controllers/testimoniosController');
const requireAdmin = require('../middlewares/requireAdmin');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// asegurar carpeta destino
const dest = path.resolve(__dirname, '../../uploads/testimonios');
fs.mkdirSync(dest, { recursive: true });

// Multer (almacenamiento local) — campo de archivo: "imagenurl"
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
const upload = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });

// Base path en app.js será /api/testimonios ⇒ rutas:
router.get('/', listarTestimonios);                                         // GET    /api/testimonios
router.get('/:id', obtenerTestimonio);                                      // GET    /api/testimonios/:id
router.post('/', requireAuth, upload.single('imagenurl'), crearTestimonio); // POST   /api/testimonios
router.put('/:id', requireAdmin, upload.single('imagenurl'), editarTestimonio); // PUT /api/testimonios/:id
router.delete('/:id', requireAdmin, eliminarTestimonio);                    // DELETE /api/testimonios/:id

module.exports = router;
