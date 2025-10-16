// src/controllers/usersAdminController.js
const db = require('../config/db');

// Campos públicos (nunca expongas passwordHash)
const PUBLIC = `id, nombre, apellidos, email, rol, isActive, createdAt`;

// GET /api/users?q=&page=&limit=
exports.listUsers = (req, res) => {
  const q = (req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  const like = `%${q}%`;

  db.all(
    `SELECT ${PUBLIC} FROM users
     WHERE email LIKE ? OR nombre LIKE ? OR apellidos LIKE ?
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    [like, like, like, limit, offset],
    (err, rows) => {
      if (err) return res.status(500).json({ ok:false, error: 'Error al listar usuarios' });
      db.get(
        `SELECT COUNT(1) as total FROM users WHERE email LIKE ? OR nombre LIKE ? OR apellidos LIKE ?`,
        [like, like, like],
        (err2, row) => {
          if (err2) return res.status(500).json({ ok:false, error: 'Error al contar usuarios' });
          res.json({ ok:true, page, limit, total: row?.total || 0, data: rows || [] });
        }
      );
    }
  );
};

// GET /api/users/:id
exports.getUser = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok:false, error: 'ID inválido' });

  db.get(`SELECT ${PUBLIC} FROM users WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ ok:false, error: 'Error al obtener usuario' });
    if (!row) return res.status(404).json({ ok:false, error: 'No encontrado' });
    res.json({ ok:true, data: row });
  });
};

// PUT /api/users/:id
exports.updateUser = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok:false, error: 'ID inválido' });

  const { nombre, apellidos, email, rol, isActive } = req.body || {};
  const fields = [];
  const values = [];

  if (typeof nombre === 'string') { fields.push('nombre = ?'); values.push(nombre.trim()); }
  if (typeof apellidos === 'string') { fields.push('apellidos = ?'); values.push(apellidos.trim()); }
  if (typeof email === 'string') { fields.push('email = ?'); values.push(email.trim().toLowerCase()); }
  if (typeof rol === 'string') {
    const r = rol.trim().toLowerCase();
    if (!['admin','usuario'].includes(r)) return res.status(400).json({ ok:false, error: 'rol inválido' });
    fields.push('rol = ?'); values.push(r);
  }
  if (typeof isActive !== 'undefined') {
    const v = (isActive === true || isActive === 1 || isActive === '1');
    fields.push('isActive = ?'); values.push(v ? 1 : 0);
  }

  if (!fields.length) return res.status(400).json({ ok:false, error: 'Nada para actualizar' });

  // seguridad: no permitir auto-degradarse ni auto-desactivarse
  if (req.user?.id === id) {
    if (fields.some(f => f.startsWith('rol')) || fields.some(f => f.startsWith('isActive'))) {
      return res.status(400).json({ ok:false, error: 'No puedes cambiar tu propio rol o estado' });
    }
  }

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  db.run(sql, [...values, id], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ ok:false, error: 'Email ya está en uso' });
      }
      return res.status(500).json({ ok:false, error: 'Error al actualizar' });
    }
    if (this.changes === 0) return res.status(404).json({ ok:false, error: 'No encontrado' });

    db.get(`SELECT ${PUBLIC} FROM users WHERE id = ?`, [id], (e2, row) => {
      if (e2) return res.status(500).json({ ok:false, error: 'Error al refrescar' });
      res.json({ ok:true, data: row });
    });
  });
};

// DELETE /api/users/:id  (soft por defecto; ?hard=true para borrado físico)
exports.deleteUser = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok:false, error: 'ID inválido' });

  if (req.user?.id === id) {
    return res.status(400).json({ ok:false, error: 'No puedes eliminar tu propio usuario' });
  }

  const hard = String(req.query.hard || '').toLowerCase() === 'true';

  if (hard) {
    db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ ok:false, error: 'Error al eliminar' });
      if (this.changes === 0) return res.status(404).json({ ok:false, error: 'No encontrado' });
      res.json({ ok:true, data: { id, hard: true } });
    });
  } else {
    db.run(`UPDATE users SET isActive = 0 WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ ok:false, error: 'Error al desactivar' });
      if (this.changes === 0) return res.status(404).json({ ok:false, error: 'No encontrado' });
      db.get(`SELECT ${PUBLIC} FROM users WHERE id = ?`, [id], (e2, row) => {
        if (e2) return res.status(500).json({ ok:false, error: 'Error al refrescar' });
        res.json({ ok:true, soft_deleted: true, data: row });
      });
    });
  }
};
