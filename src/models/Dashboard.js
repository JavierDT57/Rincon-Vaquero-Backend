// src/models/Dashboard.js
const db = require('../config/db');

const Dashboard = {
  init: () => {
    db.run(`
      CREATE TABLE IF NOT EXISTS dashboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT,
        value TEXT NOT NULL,             
        type TEXT CHECK(type IN ('number','percent','currency','json')) DEFAULT 'number',
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
  },

  getAll: () => new Promise((resolve, reject) => {
    db.all(
      `SELECT id, slug, title, value, type, updated_at FROM dashboard ORDER BY id ASC`,
      [],
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  }),

  getBySlug: (slug) => new Promise((resolve, reject) => {
    db.get(
      `SELECT id, slug, title, value, type, updated_at FROM dashboard WHERE slug = ?`,
      [slug],
      (err, row) => err ? reject(err) : resolve(row)
    );
  }),

  createOrUpdate: ({ slug, title = null, value, type = 'number' }) =>
    new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO dashboard (slug, title, value, type, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(slug) DO UPDATE SET
           title = COALESCE(excluded.title, title),
           value = excluded.value,
           type  = COALESCE(excluded.type, type),
           updated_at = datetime('now')`,
        [slug, title, String(value), type],
        function (err) {
          if (err) return reject(err);
          db.get(
            `SELECT id, slug, title, value, type, updated_at FROM dashboard WHERE slug = ?`,
            [slug],
            (e2, row) => e2 ? reject(e2) : resolve(row)
          );
        }
      );
    }),

  updateBySlug: (slug, { title = null, value = null, type = null }) =>
    new Promise((resolve, reject) => {
      const sets = [];
      const params = [];
      if (title !== null && title !== undefined) { sets.push('title = ?'); params.push(title); }
      if (value !== null && value !== undefined) { sets.push('value = ?'); params.push(String(value)); }
      if (type  !== null && type  !== undefined) { sets.push('type = ?');  params.push(type); }
      sets.push(`updated_at = datetime('now')`);
      const sql = `UPDATE dashboard SET ${sets.join(', ')} WHERE slug = ?`;
      params.push(slug);

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return resolve(null);
        db.get(
          `SELECT id, slug, title, value, type, updated_at FROM dashboard WHERE slug = ?`,
          [slug],
          (e2, row) => e2 ? reject(e2) : resolve(row)
        );
      });
    }),
};

module.exports = Dashboard;
