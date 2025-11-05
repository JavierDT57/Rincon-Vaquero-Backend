// src/services/sightengine.client.js
const axios = require('axios');
const FormData = require('form-data');
const cfg = require('../config/sightengine');

async function analyzeBuffer({ buffer, filename = 'upload.jpg' }) {
  if (!cfg.apiUser || !cfg.apiSecret) {
    const err = new Error('Faltan credenciales de Sightengine');
    err.status = 500;
    throw err;
  }

  const form = new FormData();
  form.append('media', buffer, { filename });
  form.append('models', cfg.models);
  form.append('api_user', cfg.apiUser);
  form.append('api_secret', cfg.apiSecret);

  const started = Date.now();
  let lastErr;

  for (let i = 0; i < 3; i++) {
    try {
      const resp = await axios.post(cfg.endpoint, form, {
        headers: form.getHeaders(),
        timeout: cfg.timeoutMs,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      return { raw: resp.data, latencyMs: Date.now() - started };
    } catch (e) {
      console.error('[sightengine] attempt', i + 1, 'failed', e.response?.status, e.response?.data || e.message);
      lastErr = e;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

module.exports = { analyzeBuffer };
