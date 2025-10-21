// src/middlewares/imageSecurity.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

// Detecta tipo real por firmas 
async function detectFileType(filePath) {
  const fh = await fsp.open(filePath, 'r');
  const buf = Buffer.alloc(12);
  await fh.read(buf, 0, 12, 0);
  await fh.close();

  // PNG
  if (buf.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]))) return 'png';
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  // WebP
  if (buf.slice(0,4).toString() === 'RIFF' && buf.slice(8,12).toString() === 'WEBP') return 'webp';
  // GIF 
  if (buf.slice(0,6).toString() === 'GIF87a' || buf.slice(0,6).toString() === 'GIF89a') return 'gif';
  return null;
}

// 1) Magic bytes + whitelist estricta
async function checkMagicBytes(req, res, next) {
  try {
    if (!req.file) return next();
    const type = await detectFileType(req.file.path);
    const allowed = new Set(['jpg', 'png', 'webp']); // bloquea gif/svg/heic/tiff/bmp
    if (!type || !allowed.has(type)) {
      await safeUnlink(req.file.path);
      return res.status(400).json({ ok: false, error: 'Archivo no permitido. Solo JPG/PNG/WebP.' });
    }
    req._detectedType = type;
    next();
  } catch (err) {
    await safeUnlink(req.file?.path);
    return res.status(400).json({ ok: false, error: 'Archivo inválido' });
  }
}

// 2) Límite de dimensiones (anti image-bomb)
function enforceDimensions(maxWidth = 6000, maxHeight = 6000, maxMegapixels = 30) {
  return async (req, res, next) => {
    try {
      if (!req.file) return next();
      const meta = await sharp(req.file.path).metadata();
      const w = meta.width || 0;
      const h = meta.height || 0;
      const mp = (w * h) / 1e6;

      if (w === 0 || h === 0) {
        await safeUnlink(req.file.path);
        return res.status(400).json({ ok: false, error: 'Imagen corrupta' });
      }
      if (w > maxWidth || h > maxHeight || mp > maxMegapixels) {
        await safeUnlink(req.file.path);
        return res.status(413).json({ ok: false, error: 'Dimensiones excesivas' });
      }
      next();
    } catch (err) {
      await safeUnlink(req.file?.path);
      return res.status(400).json({ ok: false, error: 'No se pudo leer la imagen' });
    }
  };
}

// 3) Re-encodeo WEBP → JPEG → PNG
function reencodeAndStrip(preferred = 'webp', quality = 85) {
  return async (req, res, next) => {
    try {
      if (!req.file) return next();

      const src = req.file.path;
      const dir = path.dirname(src);
      const base = crypto.randomBytes(12).toString('hex');

      
      async function toWEBP() {
        const out = path.join(dir, `${base}.webp`);
        await sharp(src).webp({ quality }).toFile(out);
        req.file.mimetype = 'image/webp';
        req.file.filename = path.basename(out);
        req.file.path = out;
      }

      async function toJPEG() {
        const out = path.join(dir, `${base}.jpg`);
        
        await sharp(src).flatten({ background: '#ffffff' }).jpeg({ quality, mozjpeg: true }).toFile(out);
        req.file.mimetype = 'image/jpeg';
        req.file.filename = path.basename(out);
        req.file.path = out;
      }

      async function toPNG() {
        const out = path.join(dir, `${base}.png`);
        await sharp(src).png({ compressionLevel: 9 }).toFile(out);
        req.file.mimetype = 'image/png';
        req.file.filename = path.basename(out);
        req.file.path = out;
      }

      const order =
        preferred === 'webp' ? [toWEBP, toJPEG, toPNG]
        : preferred === 'jpeg' ? [toJPEG, toPNG]
        : [toPNG, toJPEG];

      let ok = false, lastErr = null;
      for (const step of order) {
        try { await step(); ok = true; break; }
        catch (e) { lastErr = e; }
      }
      if (!ok) throw lastErr || new Error('No se pudo reencodear');

      // elimina el original (posible polyglot)
      try { await fsp.unlink(src); } catch {}

      return next();
    } catch (err) {
      try { await fsp.unlink(req.file?.path); } catch {}
      const msg = process.env.NODE_ENV === 'production'
        ? 'Error al normalizar la imagen'
        : `Error al normalizar la imagen: ${err.message}`;
      return res.status(400).json({ ok: false, error: msg });
    }
  };
}



async function safeUnlink(p) {
  if (!p) return;
  try { await fsp.unlink(p); } catch {}
}

module.exports = {
  checkMagicBytes,
  enforceDimensions,
  reencodeAndStrip,
};
