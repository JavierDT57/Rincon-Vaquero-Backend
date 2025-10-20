// src/models/User.js
const db = require('../config/db');

const User = {
  create: ({ nombre, apellidos, email, passwordHash, rol = "usuario" }) => new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (nombre, apellidos, email, passwordHash, rol) VALUES (?, ?, ?, ?, ?)`,
      [nombre, apellidos, email, passwordHash, rol],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, nombre, apellidos, email, rol });
      }
    );
  }),

  findByEmail: (email) => new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  }),

  setResetToken: (email, token, expiresAtMs) => new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?`,
      [token, expiresAtMs, email],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  }),

  clearResetToken: (email) => new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE email = ?`,
      [email],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  }),

  updatePassword: (email, newPasswordHash) => new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET passwordHash = ? WHERE email = ?`,
      [newPasswordHash, email],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  }),
};

module.exports = User;
