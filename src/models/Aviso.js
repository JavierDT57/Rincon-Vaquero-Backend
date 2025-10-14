// src/models/Aviso.js
const db = require('../config/db');

const Aviso = {
  init: () => {
    db.run(`
      CREATE TABLE IF NOT EXISTS avisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        texto  TEXT NOT NULL,
        img_url TEXT,
        fecha_creacion TEXT NOT NULL
      )
    `);
  },

  create: ({ titulo, texto, imgurl, fecha }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO avisos (titulo, texto, img_url, fecha_creacion) VALUES (?, ?, ?, ?)`,
        [titulo, texto, imgurl, fecha],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, titulo, texto, imgurl, fecha });
        }
      );
    });
  },

  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, titulo, texto, img_url AS imgurl, fecha_creacion AS fecha
         FROM avisos
         ORDER BY id DESC`,
        [],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    });
  },

  deleteById: (id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM avisos WHERE id = ?`;
    // Usamos function() para leer this.changes de sqlite
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0); // true si borró 1 registro
    });
  });
},

  updateById: (id, { titulo, texto, imgurl }) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE avisos
        SET titulo = ?, texto = ?, img_url = ?
        WHERE id = ?
      `;
      db.run(sql, [titulo, texto, imgurl, id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0); // true si actualizó algo
      });
    });
  },



  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, titulo, texto, img_url AS imgurl, fecha_creacion AS fecha
         FROM avisos WHERE id = ?`,
        [id],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });
  }
};

module.exports = Aviso;
