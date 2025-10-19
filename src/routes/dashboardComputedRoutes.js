// src/routes/dashboardComputedRoutes.js
const express = require('express');
const router = express.Router();
const { getPublicComputed } = require('../controllers/dashboardComputedController');

router.get('/computed', getPublicComputed); // GET /api/dashboard/computed

module.exports = router;
