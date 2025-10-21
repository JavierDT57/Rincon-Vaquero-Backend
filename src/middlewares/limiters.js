// src/middlewares/limiters.js
const rateLimit = require('express-rate-limit');

// Limita intentos de subida 

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,             
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones, inténtalo más tarde.' },
});

module.exports = { uploadLimiter };
