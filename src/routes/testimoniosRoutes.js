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
  eliminarTestimonio,
  listarTestimoniosModeracion, 
  aprobarTestimonio           
} = require('../controllers/testimoniosController');

const requireAdmin = require('../middlewares/requireAdmin');
const { requireAuth } = require('../middlewares/auth');
const { uploadLimiter } = require('../middlewares/limiters');
const { checkMagicBytes, enforceDimensions, reencodeAndStrip } = require('../middlewares/imageSecurity');

const router = express.Router();

const baseUploads = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../../uploads');

const dest = path.join(baseUploads, 'testimonios');
fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(12).toString('hex');
    cb(null, `${name}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Solo JPG/PNG/WebP'), false);
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, parts: 6, fields: 8 },
});

function pickSingleFile(req, _res, next) {
  if (req.files) {
    req.file = (req.files.imagen && req.files.imagen[0])
            || (req.files.imagenurl && req.files.imagenurl[0])
            || req.file;
  }
  next();
}


// Público
router.get('/', listarTestimonios);

// Crear (logueado)
router.post('/',
  requireAuth,
  uploadLimiter,
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'imagenurl', maxCount: 1 }]),
  pickSingleFile,
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  crearTestimonio
);

// Moderación (admin)
router.get('/admin', requireAdmin, listarTestimoniosModeracion);
router.patch('/admin/:id', requireAdmin, aprobarTestimonio);

// Editar/Eliminar (admin)
router.put('/:id',
  requireAdmin,
  uploadLimiter,
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'imagenurl', maxCount: 1 }]),
  pickSingleFile,
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  editarTestimonio
);

router.delete('/:id', requireAdmin, eliminarTestimonio);

// Detalle (público) — al final para no interceptar /admin
router.get('/:id', obtenerTestimonio);

module.exports = router;
