// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const userRoutes = require('./routes/userRoutes');
const avisosRoutes = require('./routes/avisosRoutes');
const testimoniosRoutes = require('./routes/testimoniosRoutes');
const dashboardComputedRoutes = require('./routes/dashboardComputedRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use((req, _res, next) => {  // DEBUG
  console.log(req.method, req.originalUrl);
  next();
});

// manejador de errores (incluye Multer)
app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ ok: false, error: 'Archivo demasiado grande (máx 5MB)' });
  }
  return res.status(400).json({ ok: false, error: err?.message || 'Error de solicitud' });
});


app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// estáticos
const uploadsRoot = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

// rutas
app.use('/api/users', userRoutes);
app.use('/api/avisos', avisosRoutes);   
app.use('/api/testimonios', testimoniosRoutes);
app.use('/api/dashboard', dashboardComputedRoutes);
app.use('/api/dashboard', dashboardRoutes);  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
