// src/app.js
require('dotenv').config();

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

const { requireAuth, requireRole } = require('./middlewares/auth'); 
const errorHandler = require('./middlewares/errorHandler');         

const app = express();


const FRONT_ORIGIN = process.env.FRONT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet({ crossOriginResourcePolicy: false }));


app.use((req, _res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});


app.use(cors({
  origin: FRONT_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
}));


app.use(express.json());
app.use(cookieParser());


const uploadsRoot = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });


app.use('/uploads', express.static(uploadsRoot));

const MIME_WHITELIST = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
};


app.use('/media', (req, res, next) => {
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
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: 'No encontrado' });
    }

    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

   
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.status(500).json({ ok: false, error: 'Error al leer el archivo' }));
    stream.pipe(res);
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Error al servir media' });
  }
});

// -------- Rutas de la API --------
app.use('/api/users', userRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/tienda', require('./routes/tiendaRoutes'));
app.use('/api/testimonios', testimoniosRoutes);
app.use('/api/dashboard', dashboardComputedRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
