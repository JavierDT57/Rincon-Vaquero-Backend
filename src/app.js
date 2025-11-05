// src/app.js
const helmet = require('helmet');
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
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ===== CORS =====
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: FRONT_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
}));

// Log simple 
if (process.env.NODE_ENV !== 'test') {
  app.use((req, _res, next) => { console.log(req.method, req.originalUrl); next(); });
}

// Parsers
app.use(express.json());
app.use(cookieParser());

// ===== Static =====
const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

app.use('/uploads', express.static(uploadsRoot));

const MIME_WHITELIST = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
app.use('/media', (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).json({ ok: false, error: 'Método no permitido' });
    }
    const rel = String(req.originalUrl.replace(/^\/media\/?/, '')).replace(/^\/*/, '');
    if (!rel) return res.status(400).json({ ok: false, error: 'Ruta requerida' });

    const filePath = path.resolve(uploadsRoot, rel);
    if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
      return res.status(400).json({ ok: false, error: 'Ruta inválida' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_WHITELIST[ext];
    if (!mime) return res.status(404).json({ ok: false, error: 'Recurso no disponible' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: 'No encontrado' });

    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.status(500).json({ ok: false, error: 'Error al leer el archivo' }));
    stream.pipe(res);
  } catch {
    return res.status(500).json({ ok: false, error: 'Error al servir media' });
  }
});

if (process.env.SANDBOX_ENABLED === 'true') {
  const sandboxRoutes = require('./routes/sandboxRoutes');
  app.use('/sandbox', sandboxRoutes);
}

// ===== Rutas API =====
app.use('/api/users', userRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/tienda', require('./routes/tiendaRoutes'));
app.use('/api/testimonios', testimoniosRoutes);
app.use('/api/dashboard', dashboardComputedRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ===== Error handler =====
app.use(errorHandler);

// Exporta app para tests
module.exports = app;

// === Auto-arranque ===
if (require.main === module) {
  require('dotenv').config();               
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
}
