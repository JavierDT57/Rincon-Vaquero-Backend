//usuario
const db = require('../config/db');

const User = {
  create: ({ nombre, apellidos, email, passwordHash, rol = "usuario" }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (nombre, apellidos, email, passwordHash, rol) VALUES (?, ?, ?, ?, ?)`,
        [nombre, apellidos, email, passwordHash, rol],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, nombre, apellidos, email, rol });
        }
      );
    });
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
//Actualizar contrasena
  updatePassword: (email, newPasswordHash) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET passwordHash = ? WHERE email = ?`, [newPasswordHash, email], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0); // true si se actualizó
    });
  });
 },
};

module.exports = User;
