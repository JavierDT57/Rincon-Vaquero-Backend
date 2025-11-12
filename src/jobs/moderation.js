// src/jobs/moderation.job.js
// Lee la imagen, llama a Sightengine, guarda analisis y asegura el resumen (Gemini)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const Testimonio = require('../models/Testimonio');
const { analyzeBuffer } = require('../services/sightengineClient');
const { ensureResumen } = require('../services/geminiSummary');
const { applyPolicyV2, CURRENT_ANALYSIS_VERSION } = require('../policies/policy.engine');

const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../../uploads');

function safeResolveFromWebPath(webPath) {
  if (!webPath || !webPath.startsWith('/uploads/')) return null;
  const rel = webPath.replace(/^\/uploads\/?/, '');
  return path.join(uploadsRoot, rel);
}

async function processModeration({ id, webPath }) {
  try {
    const abs = safeResolveFromWebPath(webPath);
    if (!abs || !fs.existsSync(abs)) {
      console.warn('[moderation] file not found:', { id, webPath, abs, uploadsRoot });
      return;
    }

    const buffer = await fs.promises.readFile(abs);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    const row = await Testimonio.getById(id);
    if (!row) return;

    //Genera analisis SOLO si está NULL 
    if (row.content_hash && row.content_hash === hash && row.analisis) {
      console.log('[moderation] skip (same hash & analisis present):', id);
      try {
        await ensureResumen({ id });
      } catch (e) {
        console.warn('[moderation] resumen omitido en skip para id', id, e.message);
      }
      return;
    }

    console.log('[moderation] calling Sightengine for id', id, 'file:', abs);
    const { raw, latencyMs } = await analyzeBuffer({ buffer, filename: path.basename(abs) });

    const derived = applyPolicyV2(raw);

    const analisisPayload = {
      provider: 'sightengine',
      provider_latency_ms: latencyMs,
      received_at: Date.now(),
      version: CURRENT_ANALYSIS_VERSION,
      raw,
      derived
    };

    const patch = { analisis: JSON.stringify(analisisPayload) };

    if ('content_hash' in row) patch.content_hash = hash;
    if ('analisis_version' in row) patch.analisis_version = CURRENT_ANALYSIS_VERSION;
    if ('moderated_at' in row) patch.moderated_at = new Date().toISOString();
    if ('decision' in row) patch.decision = derived.decision;
    if ('semaforo' in row) patch.semaforo = derived.semaforo;

    if ('score_nudity' in row) patch.score_nudity = derived.indices.nudity;
    if ('score_violence' in row) patch.score_violence = derived.indices.violence;
    if ('score_weapon' in row) patch.score_weapon = derived.indices.weapons;
    if ('score_gore' in row) patch.score_gore = derived.indices.gore;
    if ('score_offensive' in row) patch.score_offensive = derived.indices.offensive;
    if ('score_alcohol' in row) patch.score_alcohol = derived.indices.alcohol;
    if ('score_drug' in row) patch.score_drug = derived.indices.drugs;

    if ('resumen' in row) patch.resumen = null;

    await Testimonio.updateById(id, patch);
    console.log('[moderation] saved analysis for id', id);

    // Genera resumen SOLO si está NULL 
    try {
      await ensureResumen({ id, analisisPayload });
      console.log('[moderation] resumen generado para id', id);
    } catch (e) {
      console.warn('[moderation] no se pudo generar resumen para id', id, e.message);
    }
  } catch (err) {
    console.error('[moderation] error for id', id, err?.response?.data || err?.message || err);
  }
}

// Cola para procesar moderaciones en serie
const q = [];
let busy = false;

async function drain() {
  if (busy) return;
  busy = true;
  while (q.length) {
    const job = q.shift();
    await processModeration(job).catch(() => {});
  }
  busy = false;
}

function queueModeration(id, webPath) {
  console.log('[moderation] queued', { id, webPath, uploadsRoot });
  q.push({ id, webPath });
  setImmediate(drain);
}

module.exports = { queueModeration };
