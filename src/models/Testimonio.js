// src/models/Testimonio.js
const db = require('../config/db');

const Testimonio = {
  init: () => {
    // Tabla base 
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
    // Migraciones   
    db.all(`PRAGMA table_info(testimonios)`, (err, rows) => {
      if (err || !Array.isArray(rows)) return;
      const cols = rows.map(r => r.name);
      const alters = [];
      if (!cols.includes('user_id')) alters.push(`ALTER TABLE testimonios ADD COLUMN user_id INTEGER`);
      if (!cols.includes('status'))  alters.push(`ALTER TABLE testimonios ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`);

      if (alters.length) {
        db.exec(alters.join(';\n') + ';', (e2) => {
          if (e2) console.error('ALTER testimonios:', e2);
          db.run(`UPDATE testimonios SET status='approved' WHERE status IS NULL OR status=''`, () => {});
        });
      }
    });
  },

  // Crear: guarda como pending y con user_id del creador
  create: ({ userId, comentario, fecha, imagenurl, localidad, nombre, rating }) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO testimonios (user_id, comentario, fecha, imagen_url, localidad, nombre, rating, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `;
      db.run(sql, [userId || null, comentario, fecha, imagenurl, localidad, nombre, rating], function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      });
    });
  },

  // Público: SOLO aprobados
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
           id,
           comentario,
           fecha,
           imagen_url AS imagenurl,
           localidad,
           nombre,
           rating,
           status,
           user_id AS userId
         FROM testimonios
         WHERE status = 'approved'
         ORDER BY id DESC`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  // Obtener por id
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT
           id,
           comentario,
           fecha,
           imagen_url AS imagenurl,
           localidad,
           nombre,
           rating,
           status,
           user_id AS userId
         FROM testimonios
         WHERE id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },

  // Editar contenido (PUT admin)
  updateById: (id, { comentario, fecha, imagenurl, localidad, nombre, rating }) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE testimonios
        SET comentario = ?, fecha = ?, imagen_url = ?, localidad = ?, nombre = ?, rating = ?
        WHERE id = ?
      `;
      db.run(sql, [comentario, fecha, imagenurl, localidad, nombre, rating, id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
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
  },

  // Admin: listar por estado (pending | approved)
  findByStatus: (status) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
           id,
           comentario,
           fecha,
           imagen_url AS imagenurl,
           localidad,
           nombre,
           rating,
           status,
           user_id AS userId
         FROM testimonios
         WHERE status = ?
         ORDER BY id DESC`,
        [status],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  // Admin: cambiar estado
  updateStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE testimonios SET status = ? WHERE id = ?`,
        [status, id],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }
};

module.exports = Testimonio;
