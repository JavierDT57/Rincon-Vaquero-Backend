// src/controllers/dashboardController.js
const Dashboard = require('../models/Dashboard');

// crea tabla si no existe
Dashboard.init();


const DERIVADAS = new Set(['POBTOT', 'POB15MAS', 'NO_PEA', 'SIN_SS']);

const INITIAL_METRICS = [
  // Población (atómicas)
  { slug: 'POBMAS',  title: 'Hombres',                   value: 142, type: 'number' },
  { slug: 'POBFEM',  title: 'Mujeres',                   value: 108, type: 'number' },

  // Edades
  { slug: 'NINOS',   title: '0–14',                      value: 45,  type: 'number' },
  { slug: 'ADULTOS', title: '15–64',                     value: 164, type: 'number' },
  { slug: 'TERCERA', title: '65+',                       value: 41,  type: 'number' },

  // Religión
  { slug: 'CATOLICA', title: 'Católica',                 value: 206, type: 'number' },
  { slug: 'SINREL',   title: 'Sin religión',             value: 16,  type: 'number' },
  { slug: 'OTRASREL', title: 'Otras religiones',         value: 28,  type: 'number' },

  // Actividad económica
  { slug: 'PEA',    title: 'Población Económicamente Activa', value: 105, type: 'number' },
  { slug: 'PEA_M',  title: 'PEA Hombres',                value: 66,  type: 'number' },
  { slug: 'PEA_F',  title: 'PEA Mujeres',                value: 39,  type: 'number' },

  // Salud: cobertura general (atómica)
  { slug: 'DER_SS', title: 'Con servicio de salud',      value: 220, type: 'number' },

  // Salud: detalle de afiliación
  { slug: 'IMSS',   title: 'IMSS',                       value: 139, type: 'number' },
  { slug: 'IMSSB',  title: 'IMSS Bienestar',             value: 1,   type: 'number' },
  { slug: 'ISSSTE', title: 'ISSSTE',                     value: 2,   type: 'number' },
  { slug: 'ISEST',  title: 'Instituciones estatales',    value: 0,   type: 'number' },
  { slug: 'SP',     title: 'Seguro Popular',             value: 60,  type: 'number' },
  { slug: 'PRIV',   title: 'Privada',                    value: 7,   type: 'number' },
  { slug: 'PROG',   title: 'Programa público',           value: 8,   type: 'number' },
  { slug: 'OTRA',   title: 'Otra',                       value: 3,   type: 'number' },
];


const RUN_SEED_ON_START = false;

async function seedOnce() {
  try {
    const rows = await Dashboard.getAll();
    if (!rows || rows.length === 0) {
      for (const m of INITIAL_METRICS) {
        await Dashboard.createOrUpdate(m);
      }
      console.log('[dashboard] Seed inicial aplicado');
    }
  } catch (e) {
    console.error('[dashboard] Error en seed:', e.message);
  }
}
if (RUN_SEED_ON_START) seedOnce();

// ---------- Helpers de validación ----------
function validarPayload({ slug, value, type }) {
  if (!slug || value === undefined || value === null) {
    return 'slug y value son requeridos';
  }
  if (DERIVADAS.has(String(slug).trim().toUpperCase())) {
    return 'Este indicador es derivado; edítalo cambiando las métricas base';
  }
  const t = (type || 'number').toLowerCase();
  const tiposPermitidos = new Set(['number', 'percent', 'currency', 'json']);
  if (!tiposPermitidos.has(t)) {
    return 'type inválido. Usa: number | percent | currency | json';
  }
  if (t === 'number' && Number.isNaN(Number(value))) {
    return 'value debe ser numérico cuando type="number"';
  }
  return null;
}

// ---------- Handlers ----------
exports.listar = async (_req, res) => {
  try {
    const rows = await Dashboard.getAll();
    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { slug } = req.params;
    const row = await Dashboard.getBySlug(slug);
    if (!row) return res.status(404).json({ ok: false, error: 'No encontrado' });
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.crearOActualizar = async (req, res) => {
  try {
    const { slug, title, value, type } = req.body || {};
    const errMsg = validarPayload({ slug, value, type });
    if (errMsg) return res.status(400).json({ ok: false, error: errMsg });

    const saved = await Dashboard.createOrUpdate({
      slug: String(slug).trim().toUpperCase(), // normalizamos a MAYÚSCULAS
      title: title != null ? String(title).trim() : null,
      value,
      type: (type || 'number').toLowerCase(),
    });
    return res.status(201).json({ ok: true, data: saved });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.actualizarPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const normSlug = String(slug).trim().toUpperCase();
    if (DERIVADAS.has(normSlug)) {
      return res.status(400).json({ ok: false, error: 'Indicador derivado; no editable directamente' });
    }

    const { title, value, type } = req.body || {};
    if (title === undefined && value === undefined && type === undefined) {
      return res.status(400).json({ ok: false, error: 'Nada que actualizar' });
    }
    if (type !== undefined) {
      const errType = validarPayload({ slug: normSlug, value: (value ?? 0), type });
      if (errType) return res.status(400).json({ ok: false, error: errType });
    }
    if (type === 'number' && value !== undefined && Number.isNaN(Number(value))) {
      return res.status(400).json({ ok: false, error: 'value debe ser numérico cuando type="number"' });
    }

    const updated = await Dashboard.updateBySlug(normSlug, {
      title,
      value,
      type: type ? String(type).toLowerCase() : undefined,
    });
    if (!updated) return res.status(404).json({ ok: false, error: 'No encontrado' });
    return res.json({ ok: true, data: updated });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
