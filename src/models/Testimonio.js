// src/models/Testimonio.js
const db = require('../config/db');

const Testimonio = {
  init: () => {
    db.run(`
      CREATE TABLE IF NOT EXISTS testimonios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comentario TEXT NOT NULL,
        fecha TEXT NOT NULL,
        imagen_url TEXT,
        localidad TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)
      )
    `);
  },

  create: ({ comentario, fecha, imagenurl, localidad, nombre, rating }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO testimonios (comentario, fecha, imagen_url, localidad, nombre, rating)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [comentario, fecha, imagenurl, localidad, nombre, rating],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, comentario, fecha, imagenurl, localidad, nombre, rating });
        }
      );
    });
  },

  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, comentario, fecha, imagen_url AS imagenurl, localidad, nombre, rating
         FROM testimonios
         ORDER BY id DESC`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, comentario, fecha, imagen_url AS imagenurl, localidad, nombre, rating
         FROM testimonios WHERE id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },
  updateById: (id, { comentario, fecha, imagenurl, localidad, nombre, rating }) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE testimonios
      SET comentario = ?, fecha = ?, imagen_url = ?, localidad = ?, nombre = ?, rating = ?
      WHERE id = ?
    `;
    db.run(sql, [comentario, fecha, imagenurl, localidad, nombre, rating, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0); // true si actualizó algo
    });
  });
},

  deleteById: (id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM testimonios WHERE id = ?`, [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
};


module.exports = Testimonio;
