const multer = require('multer');

// En memoria; límite de 8 MB (ajústalo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function requireFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere un archivo en el campo "file"' });
  }
  next();
}

module.exports = { uploadSingle: upload.single('file'), requireFile };
