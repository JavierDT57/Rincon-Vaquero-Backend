// src/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const envPath = process.env.DB_PATH;
let dbPath;

if (envPath === ':memory:') {
  dbPath = ':memory:'; // tests
} else if (envPath) {
  const abs = path.resolve(envPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  dbPath = abs;
} else {
  const defDir = path.resolve(__dirname, '../../db');
  fs.mkdirSync(defDir, { recursive: true });
  dbPath = path.join(defDir, 'rinconvaquero.sqlite'); 
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error al conectar SQLite:', err.message);
  else if (process.env.NODE_ENV !== 'test') console.log('SQLite:', dbPath);
});


if (process.env.NODE_ENV !== 'test') {
  db.serialize(() => {
    db.all(`PRAGMA table_info(users)`, (err, rows) => {
      if (err || !Array.isArray(rows)) return;
      const cols = rows.map(r => r.name);
      const missing = [];
      if (!cols.includes('reset_token'))   missing.push('ALTER TABLE users ADD COLUMN reset_token TEXT;');
      if (!cols.includes('reset_expires')) missing.push('ALTER TABLE users ADD COLUMN reset_expires INTEGER;');
      if (missing.length) db.exec(missing.join('\n'), (e2) => { if (e2) console.error('ALTER users:', e2); });
    });
  });
}

module.exports = db;
