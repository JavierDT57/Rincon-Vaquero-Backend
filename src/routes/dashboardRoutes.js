// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();

const {
  listar,
  obtener,
  crearOActualizar,
  actualizarPorSlug,
  eliminarPorSlug,
} = require('../controllers/dashboardController');
const requireAdmin = require('../middlewares/requireAdmin');

// Lectura
router.get('/', listar);                   // GET  /api/dashboard
router.get('/:slug', obtener);             // GET  /api/dashboard/:slug

// Escritura
router.post('/', requireAdmin, crearOActualizar);          // POST /api/dashboard
router.put('/:slug', requireAdmin, actualizarPorSlug);     // PUT  /api/dashboard/:slug

module.exports = router;
