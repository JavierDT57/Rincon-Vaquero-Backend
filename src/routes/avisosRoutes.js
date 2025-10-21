// src/routes/avisosRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { crearAviso, listarAvisos, obtenerAviso, eliminarAviso, editarAviso } = require('../controllers/avisosController');
const requireAdmin = require('../middlewares/requireAdmin');
const { uploadLimiter } = require('../middlewares/limiters');
const { checkMagicBytes, enforceDimensions, reencodeAndStrip } = require('../middlewares/imageSecurity');

const router = express.Router();


const dest = path.resolve(__dirname, '../../uploads/avisos');
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
  const allowed = ['image/png', 'image/jpeg', 'image/webp']; // bloquea gif/svg/etc.
  if (!allowed.includes(file.mimetype)) return cb(new Error('Solo JPG/PNG/WebP'), false);
  cb(null, true);
}
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, parts: 6, fields: 6 },
});


router.get('/', listarAvisos);
router.get('/:id', obtenerAviso);


router.post('/',
  requireAdmin,
  uploadLimiter,
  upload.single('imagen'),
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  crearAviso
);

router.put('/:id',
  requireAdmin,
  uploadLimiter,
  upload.single('imagen'),
  checkMagicBytes,
  enforceDimensions(6000, 6000, 30),
  reencodeAndStrip('webp', 85),
  editarAviso
);

router.delete('/:id', requireAdmin, eliminarAviso);

module.exports = router;
