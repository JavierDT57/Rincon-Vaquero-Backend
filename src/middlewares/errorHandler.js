// src/middlewares/errorHandler.js
const multer = require('multer');

// Middleware global 
module.exports = function errorHandler(err, req, res, next) {
  
  if (res.headersSent) return next(err);

  
  if (err instanceof multer.MulterError) {
    let status = 400;
    let message = `Error de subida: ${err.code}`;

    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413;
      message = 'Archivo demasiado grande';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      status = 400;
      message = 'Campo de archivo no permitido';
    }
    return res.status(status).json({ ok: false, error: message });
  }


  const status = err.status || err.statusCode || 400;
  const message = err.message || 'Error en la solicitud';
  return res.status(status).json({ ok: false, error: message });
};
