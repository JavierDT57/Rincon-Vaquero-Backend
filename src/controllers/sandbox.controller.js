const { analyzeBuffer } = require('../services/sightengineClient');

async function ping(_req, res) {
  return res.json({ ok: true, service: 'sandbox', provider: 'sightengine' });
}

async function uploadAnalysis(req, res) {
  try {
    const { buffer, originalname } = req.file;
    const { raw, latencyMs } = await analyzeBuffer({ buffer, filename: originalname || 'upload.jpg' });

    // Devuelve exactamente lo que responde Sightengine
    return res.status(200).json({ latency_ms: latencyMs, ...raw });
  } catch (err) {
    const status = err.status || err.response?.status || 502;
    const details = err.response?.data || err.message;
    return res.status(status).json({ error: 'Sightengine error', details });
  }
}

module.exports = { ping, uploadAnalysis };
