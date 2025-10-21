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
const { requireAuth } = require('../middlewares/auth'); // tu middleware de sesión
const { uploadLimiter } = require('../middlewares/limiters');
const { checkMagicBytes, enforceDimensions, reencodeAndStrip } = require('../middlewares/imageSecurity');

const router = express.Router();


const dest = path.resolve(__dirname, '../../uploads/testimonios');
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


router.get('/', listarTestimonios);
router.get('/:id', obtenerTestimonio);


router.post('/',
  requireAuth,
  uploadLimiter,
  upload.single('imagenurl'),     
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  crearTestimonio
);


router.put('/:id',
  requireAdmin,
  uploadLimiter,
  upload.single('imagenurl'),
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 8),
  editarTestimonio
);

router.delete('/:id', requireAdmin, eliminarTestimonio);

module.exports = router;
