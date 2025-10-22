// src/db/migrate.js
const db = require('../src/config/db');

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, err => (err ? reject(err) : resolve()));
  });
}

function serialize(sqls) {
  return new Promise(async (resolve, reject) => {
    db.serialize(async () => {
      try {
        for (const s of sqls) await run(s);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function migrate() {
  const SQL = [
    // ==== USERS ====
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      apellidos TEXT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      rol TEXT DEFAULT 'usuario',
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,

    // ==== PASSWORD RESET ====
    `CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // ==== TESTIMONIOS ====
    `CREATE TABLE IF NOT EXISTS testimonios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      comentario TEXT,
      localidad TEXT,
      rating INTEGER,
      imgurl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    );`,

    // ==== AVISOS ====
    `CREATE TABLE IF NOT EXISTS avisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      texto TEXT NOT NULL,
      imgurl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    );`,

    // ==== DASHBOARD ====
    `CREATE TABLE IF NOT EXISTS dashboard_atomicas (
      slug TEXT PRIMARY KEY,
      valor REAL,
      tipo TEXT DEFAULT 'numero',
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  ];

  await serialize(SQL);
}

async function seedMinimal() {
  const q = `INSERT OR IGNORE INTO users (nombre, apellidos, email, passwordHash, rol, isActive)
             VALUES (?, ?, ?, ?, ?, ?)`;
  return new Promise((resolve, reject) => {
    db.run(q, ['Admin','Test','admin@test.com','__hash__','admin',1], err => (err ? reject(err) : resolve()));
  });
}

module.exports = { migrate, seedMinimal };
