// src/services/geminiClient.js
require('dotenv').config();

let _ai = null;
async function getClient() {
  if (_ai) return _ai;
  const { GoogleGenAI } = await import('@google/genai');
  _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

async function generate({ model, contents, systemInstruction, temperature = 0.2, maxOutputTokens = 60 }) {
  const ai = await getClient();
  const res = await ai.models.generateContent({
    model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents,
    config: {
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseMimeType: 'text/plain'
    }
  });
  return (res?.text || '').trim();
}

module.exports = { generate };
