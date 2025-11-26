// src/app.js
const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const userRoutes = require("./routes/userRoutes");
const avisosRoutes = require("./routes/avisosRoutes");
const testimoniosRoutes = require("./routes/testimoniosRoutes");
const dashboardComputedRoutes = require("./routes/dashboardComputedRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Inicializar modelo Producto (si aplica)
require("./models/Producto").init();

// =======================================================
// CORS — DEV & PRODUCCIÓN
// =======================================================

const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log("Origen bloqueado por CORS:", origin);
    return callback(new Error("No autorizado por CORS"), false);
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));


// Seguridad básica sin bloquear imágenes/recursos
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// =======================================================
// Log requests
// =======================================================
if (process.env.NODE_ENV !== "test") {
  app.use((req, _res, next) => {
    console.log(req.method, req.originalUrl);
    next();
  });
}

// =======================================================
// Parsers
// =======================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// =======================================================
// STATIC / UPLOADS
// =======================================================
const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "../uploads");

fs.mkdirSync(uploadsRoot, { recursive: true });

// Servir archivos subidos vía /uploads
app.use("/uploads", express.static(uploadsRoot));

// Servir media (optimizado)
const MIME_WHITELIST = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

app.use("/media", (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return res.status(405).json({ ok: false, error: "Método no permitido" });
    }

    const rel = String(req.originalUrl.replace(/^\/media\/?/, "")).replace(
      /^\/*/,
      ""
    );
    if (!rel) return res.status(400).json({ ok: false, error: "Ruta requerida" });

    const filePath = path.resolve(uploadsRoot, rel);
    if (
      !filePath.startsWith(uploadsRoot + path.sep) &&
      filePath !== uploadsRoot
    ) {
      return res.status(400).json({ ok: false, error: "Ruta inválida" });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_WHITELIST[ext];
    if (!mime) return res.status(404).json({ ok: false, error: "Recurso no disponible" });
    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: "No encontrado" });

    res.setHeader("Content-Type", mime);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => res.status(500).json({ ok: false, error: "Error al leer el archivo" }));
    stream.pipe(res);
  } catch {
    return res.status(500).json({ ok: false, error: "Error al servir media" });
  }
});

// =======================================================
// SANDBOX (si aplica)
// =======================================================
if (process.env.SANDBOX_ENABLED === "true") {
  const sandboxRoutes = require("./routes/sandboxRoutes");
  app.use("/sandbox", sandboxRoutes);
}

// =======================================================
// Rutas de API con /api/*
// =======================================================
app.use("/api/users", userRoutes);
app.use("/api/avisos", avisosRoutes);
app.use("/api/tienda", require("./routes/tiendaRoutes"));
app.use("/api/testimonios", testimoniosRoutes);
app.use("/api/dashboard", dashboardComputedRoutes);
app.use("/api/dashboard", dashboardRoutes);

// =======================================================
// Error handler final
// =======================================================
app.use(errorHandler);

// =======================================================
// Exportar app para tests
// =======================================================
module.exports = app;


