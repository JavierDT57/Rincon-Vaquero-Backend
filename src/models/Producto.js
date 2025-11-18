// src/models/Producto.js
const db = require('../config/db');

const Producto = {
  init: () => {
    db.run(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        imagen_url TEXT,
        precio REAL NOT NULL,
        categoria TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        ubicacion TEXT,
        user_id INTEGER,
        status TEXT NOT NULL DEFAULT 'pending'
      )
    `);

    db.all(`PRAGMA table_info(productos)`, (err, rows) => {
      if (err || !Array.isArray(rows)) return;
      const cols = rows.map(r => r.name);
      const alters = [];

      if (!cols.includes('user_id')) alters.push(`ALTER TABLE productos ADD COLUMN user_id INTEGER`);
      if (!cols.includes('status')) alters.push(`ALTER TABLE productos ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`);
      if (!cols.includes('imagen_url')) alters.push(`ALTER TABLE productos ADD COLUMN imagen_url TEXT`);
      if (!cols.includes('categoria')) alters.push(`ALTER TABLE productos ADD COLUMN categoria TEXT`);
      if (!cols.includes('stock')) alters.push(`ALTER TABLE productos ADD COLUMN stock INTEGER NOT NULL DEFAULT 0`);
      if (!cols.includes('ubicacion')) alters.push(`ALTER TABLE productos ADD COLUMN ubicacion TEXT`);

      if (alters.length) {
        db.exec(alters.join(';\n') + ';', (e2) => {
          if (e2) console.error('ALTER productos:', e2);
          db.run(`UPDATE productos SET status='approved' WHERE status IS NULL OR status=''`, () => {});
        });
      }
    });
  },

  create: ({ userId, nombre, imagenurl, precio, categoria, stock, ubicacion }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO productos 
         (user_id, nombre, imagen_url, precio, categoria, stock, ubicacion, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, nombre, imagenurl, precio, categoria, stock, ubicacion],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  },

  findByStatus: (status) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, user_id AS userId, nombre, imagen_url AS imagenurl,
                precio, categoria, stock, ubicacion, status
         FROM productos
         WHERE status = ?
         ORDER BY id DESC`,
        [status],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, user_id AS userId, nombre, imagen_url AS imagenurl,
                precio, categoria, stock, ubicacion, status
         FROM productos
         ORDER BY id DESC`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  findByUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, user_id AS userId, nombre, imagen_url AS imagenurl,
                precio, categoria, stock, ubicacion, status
         FROM productos
         WHERE user_id = ?
         ORDER BY id DESC`,
        [userId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, user_id AS userId, nombre, imagen_url AS imagenurl,
                precio, categoria, stock, ubicacion, status
         FROM productos
         WHERE id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },

  updateById: (id, patch) => {
    return new Promise((resolve, reject) => {
      const map = {
        nombre: 'nombre',
        imagenurl: 'imagen_url',
        precio: 'precio',
        categoria: 'categoria',
        stock: 'stock',
        ubicacion: 'ubicacion',
        status: 'status',
      };

      const sets = [];
      const params = [];

      for (const [k, v] of Object.entries(patch)) {
        if (map[k]) {
          sets.push(`${map[k]} = ?`);
          params.push(v);
        }
      }

      if (!sets.length) return resolve(false);

      const sql = `UPDATE productos SET ${sets.join(', ')} WHERE id = ?`;
      params.push(id);

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  },

  updateStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE productos SET status=? WHERE id=?`,
        [status, id],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  },

  deleteById: (id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM productos WHERE id=?`, [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
};

module.exports = Producto;
