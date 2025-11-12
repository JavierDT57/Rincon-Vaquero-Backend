// src/services/gemini.summary.js
require('dotenv').config();
const Testimonio = require('../models/Testimonio');

let _ai = null;
async function getAI() {
  if (_ai) return _ai;
  const { GoogleGenAI } = await import('@google/genai');
  _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ---------- Utilidades para hints ----------
function n(x) { return (typeof x === 'number' && isFinite(x)) ? x : 0; }
function pickTop(obj = {}) {
  let kTop = null; let vTop = -1;
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase() === 'prob' || k.toLowerCase() === 'classes') continue;
    const nv = n(v);
    if (nv > vTop) { vTop = nv; kTop = k; }
  }
  return [kTop, vTop];
}

function computeColor(analisisObj = {}) {
  const sem = (analisisObj?.derived?.semaforo || '').toLowerCase();
  const dec = (analisisObj?.derived?.decision || '').toLowerCase();
  if (sem === 'rojo') return 'Rojo';
  if (sem === 'amarillo' || sem === 'naranja') return 'Naranja';
  if (sem === 'verde') return 'Verde';
  if (dec === 'rejected') return 'Rojo';
  if (dec === 'needs_review' || dec === 'manual') return 'Naranja';
  return 'Verde';
}

function reasonHints(analisisObj = {}) {
  const raw = analisisObj.raw || {};
  const hints = [];

  // Armas
  const w = (raw.weapon && raw.weapon.classes) || {};
  const act = (raw.weapon && raw.weapon.firearm_action) || {};
  
  // Si es arma de juguete, priorizamos esa descripción
  if (n(w.firearm_toy) >= 0.5) hints.push('arma de fuego de juguete');

  if (n(w.firearm) >= 0.2) {
    if (n(act.aiming_threat) >= 0.3) hints.push('arma de fuego apuntando de forma amenazante');
    else if (n(act.aiming_camera) >= 0.3) hints.push('arma de fuego apuntando a la cámara');
    else if (n(act.in_hand_not_aiming) >= 0.25) hints.push('arma de fuego visible en la mano');
    else hints.push('arma de fuego visible');
  }
  if (n(w.knife) >= 0.2) hints.push('cuchillo visible');

  // Nudity / erotismo
  const nud = raw.nudity || {};
  
  if (n(nud.erotica) >= 0.7) hints.push('alto nivel de erotismo');
  if (n(nud.very_suggestive) >= 0.7) hints.push('contenido muy sugerente');

  const mc = nud.male_chest_categories || {};
  if (n(mc.very_revealing) >= 0.5) hints.push('torso masculino muy revelador');
  else if (n(mc.revealing) >= 0.5) hints.push('torso masculino revelador');

  const sc = nud.suggestive_classes || {};
  const [scKey, scVal] = pickTop(sc);
  if (n(scVal) >= 0.6) {
    if (scKey === 'bikini') hints.push('bikini visible');
    if (scKey === 'lingerie') hints.push('lencería visible');
    if (scKey === 'miniskirt') hints.push('minifalda reveladora');
    if (scKey === 'minishort') hints.push('short muy corto');
    if (scKey === 'cleavage') {
      const cats = nud.cleavage_categories || {};
      if (n(cats.very_revealing) >= 0.5) hints.push('escote muy pronunciado');
      else if (n(cats.revealing) >= 0.5) hints.push('escote pronunciado');
      else hints.push('escote visible');
    }
  }

  // Violencia / gore / ofensivo 
  const viol = raw.violence || {};
  const violc = viol.classes || {}; 
  const [vkey, vval] = pickTop(violc);
  
  if (n(viol.prob) >= 0.3) hints.push('violencia explícita');
  else if (n(vval) >= 0.5) {
      if (vkey === 'physical_violence') hints.push('violencia física');
      if (vkey === 'firearm_threat') hints.push('amenaza con arma de fuego');
      if (vkey === 'combat_sport') hints.push('deporte de combate excesivo');
  }

  const goreObj = raw.gore || {};
  if (n(goreObj.prob) >= 0.4) hints.push('sangre o heridas graves');

  const off = raw.offensive || {};
  const [okey, oval] = pickTop(off); 
  
  // Reforzar umbral para ofensas críticas
  if (n(oval) >= 0.2) { 
    // === ESTO IDENTIFICA NAZI, SUPREMACISTA, ETC. ===
    if (['nazi', 'supremacist', 'asian_swastika', 'confederate'].includes(okey)) hints.push('símbolos de odio');
    if (okey === 'middle_finger') hints.push('gesto ofensivo');
    // === ESTO IDENTIFICA TERRORISMO/EXTREMISMO ===
    if (okey === 'terrorist') hints.push('simbolismo extremista');
  }

  const drug = raw.recreational_drug || {};
  if (n(drug.prob) >= 0.4 || n((drug.classes || {}).cannabis) >= 0.4) hints.push('drogas recreativas');

  const alc = raw.alcohol || {};
  if (n(alc.prob) >= 0.4) hints.push('alcohol');

  return [...new Set(hints)].slice(0, 2);
}

// --- Sanitizar ---
function sanitizeOutput(text, color, hints) {
  let out = (text || '').trim();
  
  const specificHint = hints.length > 0 
      ? hints[0].toLowerCase().replace(/^(por |el |la |los |las )/i, '').trim()
      : null;
  const action = color === 'Rojo' ? 'inaceptable' : 'requiere revisión';

  // 1. Caso Verde 
  if (color === 'Verde') {
    return 'Verde: Aprobado. No se detectan riesgos relevantes.';
  }

  // 2. Limpieza inicial 
  out = out.replace(/\(?\b\d+(?:[.,]\d+)?\b\)?/g, '');
  out = out.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim();
  
  // Normalizar prefijo de Gemini si existe
  out = out.replace(/^Rojo:/i, 'Rojo:').replace(/^Naranja:/i, 'Naranja:');


  // 3. Caso Rojo/Naranja
  const reasonText = out.replace(/^(Rojo|Naranja):\s*/i, '').trim();
  // Vago = no 'por' o razón muy corta (menos de 5 caracteres)
  const isVague = !/\bpor\b/i.test(reasonText) || reasonText.length < 5; 
  
  if (isVague && specificHint) {
      return `${color}: El contenido es ${action} por ${specificHint}.`;
  }
  
  // 5. Normalización final (Si Gemini fue específico, solo aseguramos la longitud)
  
  // Asegurar que el prefijo existe 
  if (!/^(Rojo|Naranja):/i.test(out)) {
    out = `${color}: ${out}`;
  }

  // Limitar longitud (25 palabras)
  const words = out.split(/\s+/);
  if (words.length > 26) {
    out = words.slice(0, 26).join(' ');
    if (!/[.!?]$/.test(out)) out += '.';
  }

  const finalReasonText = out.replace(/^(Rojo|Naranja):\s*/i, '').trim();
  
  if (finalReasonText.length === 0 && specificHint) {
      return `${color}: El contenido es ${action} por ${specificHint}.`;
  } 
  

  if (finalReasonText.length === 0 && !specificHint) {
      return `${color}: El contenido es ${action} y no se puede determinar la razón específica.`;
  }

  return out;
}

// ---------- Llamada a Gemini ----------
async function askGemini(color, analisisObj, hints) {
  const ai = await getAI();

  // === Contexto ===
  const systemInstruction =
    'Eres un asistente que redacta un resumen de moderación de imagen para administradores. ' +
    'Devuelve EXACTAMENTE UNA oración en español, directa y concisa. ' +
    'FORMATO OBLIGATORIO:\n' +
    '- Debes comenzar con el prefijo EXACTO "[COLOR]: " donde COLOR ∈ {Rojo, Naranja, Verde}.\n' +
    '- Después del prefijo:\n' +
    "  * Rojo → usa: 'El contenido es inaceptable por …'\n" +
    "  * Naranja → usa: 'Requiere revisión por …'\n" +
    "  * Verde → usa: 'Aprobado. No se detectan riesgos relevantes.' (no añadas razones)\n" +
    '- **Utiliza ÚNICAMENTE las palabras clave dentro del array PISTAS para la razón.**\n' +
    '- No incluyas números, porcentajes ni probabilidades.\n' +
    '- Longitud objetivo: ≤ 25 palabras.';
  // =============================================================

  const fewShots = [
    {
      role: 'user',
      parts: [{ text: 'COLOR=Rojo\nPISTAS=["alto nivel de erotismo"]\nJSON={...}' }]
    },
    { role: 'model', parts: [{ text: 'Rojo: El contenido es inaceptable por el alto nivel de erotismo detectado.' }] },
    
    {
      role: 'user',
      parts: [{ text: 'COLOR=Rojo\nPISTAS=["símbolos de odio"]\nJSON={...}' }]
    },
    { role: 'model', parts: [{ text: 'Rojo: El contenido es inaceptable por la presencia de símbolos de odio.' }] },
    
    // EJEMPLO ORIGINAL 1: Rojo
    {
      role: 'user',
      parts: [{ text: 'COLOR=Rojo\nPISTAS=["arma de fuego visible en la mano","torso masculino muy revelador"]\nJSON={...}' }]
    },
    { role: 'model', parts: [{ text: 'Rojo: El contenido es inaceptable por la presencia de un arma de fuego visible en la mano y torso masculino muy revelador.' }] },

    // EJEMPLO ORIGINAL 2: Naranja
    {
      role: 'user',
      parts: [{ text: 'COLOR=Naranja\nPISTAS=["contenido muy sugerente"]\nJSON={...}' }]
    },
    { role: 'model', parts: [{ text: 'Naranja: Requiere revisión por contenido muy sugerente.' }] },
    
    // EJEMPLO ORIGINAL 3: Verde
    {
      role: 'user',
      parts: [{ text: 'COLOR=Verde\nPISTAS=[]\nJSON={...}' }]
    },
    { role: 'model', parts: [{ text: 'Verde: Aprobado. No se detectan riesgos relevantes.' }] }
  ];

  const userParts = [
    { text: `COLOR=${color}` },
    { text: `PISTAS=${JSON.stringify(hints)}` },
    { text: `JSON=${JSON.stringify(analisisObj)}` } 
  ];

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      ...fewShots,
      { role: 'user', parts: userParts }
    ],
    config: {
      systemInstruction,
      temperature: 0.1,
      maxOutputTokens: 80,
      responseMimeType: 'text/plain'
    }
  });

  return (res?.text || '').trim();
}

// ---------- API principal ----------
async function ensureResumen({ id, analisisPayload }) {
  const row = await Testimonio.getById(id);
  if (!row) throw new Error('Testimonio no encontrado');

  const ya = (row.resumen || '').trim();
  if (ya) return ya; 

  // Tomar analisis del payload 
  let analisis = analisisPayload;
  if (!analisis) {
    if (!row.analisis) throw new Error('Aún no hay análisis');
    try { analisis = JSON.parse(row.analisis); } catch { analisis = row.analisis; }
  }
  if (typeof analisis === 'string') {
    try { analisis = JSON.parse(analisis); } catch { analisis = { raw: {}, derived: {} }; }
  }

  const color = computeColor(analisis);
  const hints = reasonHints(analisis);

  // 1) Pedimos a Gemini
  let texto = await askGemini(color, analisis, hints);

  // 2) Sanitizamos para eliminar números
  let resumen = sanitizeOutput(texto, color, hints);

  // 3) Fallback si por alguna razón quedó verde sin la frase fija
  if (color === 'Verde') resumen = 'Verde: Aprobado. No se detectan riesgos relevantes.';

  // Guardar
  await Testimonio.updateById(id, { resumen });
  return resumen;
}

module.exports = { ensureResumen };