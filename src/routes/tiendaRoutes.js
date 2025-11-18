// src/routes/tiendaRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const {
  crearProducto,
  listarProductosPublicos,
  obtenerProducto,
  editarProducto,
  eliminarProducto,
  listarProductosModeracion,
  cambiarStatusProducto,
  listarProductosUsuario
} = require('../controllers/tiendaController');

const requireAdmin = require('../middlewares/requireAdmin');
const { requireAuth } = require('../middlewares/auth');
const { uploadLimiter } = require('../middlewares/limiters');
const { checkMagicBytes, enforceDimensions, reencodeAndStrip } = require('../middlewares/imageSecurity');

const router = express.Router();

const baseUploads = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../../uploads');

const dest = path.join(baseUploads, 'tienda');
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
  limits: { fileSize: 10 * 1024 * 1024, files: 1, parts: 10, fields: 10 },
});

function pickSingleFile(req, _res, next) {
  if (req.files) {
    req.file = (req.files.imagen && req.files.imagen[0])
            || (req.files.imagenurl && req.files.imagenurl[0])
            || req.file;
  }
  next();
}


// RUTAS PÚBLICAS
router.get('/', requireAuth, listarProductosPublicos);


// RUTAS DE USUARIO
router.get('/mis', requireAuth, listarProductosUsuario);

router.post('/',
  requireAuth,
  uploadLimiter,
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'imagenurl', maxCount: 1 }]),
  pickSingleFile,
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  crearProducto
);

router.put('/:id',
  requireAuth,
  uploadLimiter,
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'imagenurl', maxCount: 1 }]),
  pickSingleFile,
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  editarProducto
);

router.delete('/:id', requireAuth, eliminarProducto);

// ======================
// RUTAS ADMIN
// ======================
router.get('/admin', requireAdmin, listarProductosModeracion);

router.patch('/admin/:id', requireAdmin, cambiarStatusProducto);

// ======================
// DETALLE (público)
// ======================
router.get('/:id', requireAuth ,obtenerProducto);

module.exports = router;
