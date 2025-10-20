// src/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.resolve(dbDir, 'rinconvaquero.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite en:', dbPath);
  }
});


db.serialize(() => {
  db.all(`PRAGMA table_info(users)`, (err, rows) => {
    if (err) {
      console.error('Error leyendo schema de users:', err);
      return;
    }
    const cols = rows.map(r => r.name);
    const missing = [];
    if (!cols.includes('reset_token')) missing.push('ALTER TABLE users ADD COLUMN reset_token TEXT;');
    if (!cols.includes('reset_expires')) missing.push('ALTER TABLE users ADD COLUMN reset_expires INTEGER;');

    if (missing.length) {
      console.log('Agregando columnas faltantes a users:', missing);
      db.exec(missing.join('\n'), (e2) => {
        if (e2) console.error('Error al ALTER TABLE users:', e2);
      });
    }
  });
});



module.exports = db;
