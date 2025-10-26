//tests/setup.global.js
const { migrate } = require('../db/migrate'); 

const fs = require('fs');
const path = require('path');

jest.setTimeout(30000);

// Helpers de FS

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeRm(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    safeRm(full);
  }
}

// Mock global de nodemailer
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


const PUBLIC_BASE = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), 'uploads');

const TMP_BASE = process.env.UPLOADS_TMP_DIR
  ? path.resolve(process.env.UPLOADS_TMP_DIR)
  : path.resolve(process.cwd(), '.tmp', 'uploads');

// Subcarpetas 
const WORK_DIRS = [
  path.join(PUBLIC_BASE),
  path.join(PUBLIC_BASE, 'avisos'),
  path.join(PUBLIC_BASE, 'testimonios'),
  path.join(TMP_BASE),
  path.join(TMP_BASE, 'avisos'),
  path.join(TMP_BASE, 'testimonios'),
];

// Migración de DB 

beforeAll(async () => {
  await migrate(); // DB de test

  safeRm(TMP_BASE);
  for (const d of WORK_DIRS) ensure(d);

  emptyDir(PUBLIC_BASE);
  ensure(path.join(PUBLIC_BASE, 'avisos'));
  ensure(path.join(PUBLIC_BASE, 'testimonios'));
});

// Limpieza entre tests 

afterEach(() => {
  emptyDir(path.join(PUBLIC_BASE, 'avisos'));
  emptyDir(path.join(PUBLIC_BASE, 'testimonios'));
  emptyDir(path.join(TMP_BASE, 'avisos'));
  emptyDir(path.join(TMP_BASE, 'testimonios'));
});

// Limpieza final
afterAll(() => {
  safeRm(TMP_BASE);
  emptyDir(path.join(PUBLIC_BASE, 'avisos'));
  emptyDir(path.join(PUBLIC_BASE, 'testimonios'));
});

const mute = (orig) => (...args) => {
  const msg = (args[0] || '') + '';
  if (
    msg.startsWith('GET ') ||
    msg.startsWith('POST ') ||
    msg.startsWith('PUT ') ||
    msg.startsWith('DELETE ')
  ) return;
  return orig.apply(console, args);
};
