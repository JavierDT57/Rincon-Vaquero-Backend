// __tests__/setup.global.js
const { migrate } = require('../db/migrate'); // migración

beforeAll(async () => {
  await migrate(); // DB de test
});


const fs = require('fs');
const path = require('path');

jest.setTimeout(30000); 

// 1) Mock global de nodemailer 
jest.mock('nodemailer', () => {
  return {
    createTransport: () => ({
      
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'mocked-message-id',
        accepted: [],
        rejected: [],
        response: '250 OK: queued as MOCK',
      }),
    }),
  };
});

// 2) carpeta temporal de uploads 
const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '..', '..', '.tmp', 'uploads');

function safeRm(dir) {
  try {
    
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    try { fs.rmdirSync(dir, { recursive: true }); } catch (_) {}
  }
}

beforeAll(() => {
  // limpiar y crea carpeta
  safeRm(uploadsRoot);
  fs.mkdirSync(uploadsRoot, { recursive: true });
});

afterEach(() => {
  
  try {
    for (const p of fs.readdirSync(uploadsRoot)) {
      const full = path.join(uploadsRoot, p);
      safeRm(full);
    }
  } catch {}
});

afterAll(() => {
  // borrar todo al terminar 
  safeRm(uploadsRoot);
});

// 
const mute = (orig) => (...args) => {
  const msg = (args[0] || '') + '';
  
  if (msg.startsWith('GET ') || msg.startsWith('POST ') || msg.startsWith('PUT ') || msg.startsWith('DELETE ')) return;
  return orig.apply(console, args);
};

