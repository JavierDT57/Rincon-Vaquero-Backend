const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (e) {
      e ? reject(e) : resolve(this.lastID);
    })
  );

function pickList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.productos)) return body.productos;
  if (Array.isArray(body.publicaciones)) return body.publicaciones;
  return [];
}

function pickId(p) {
  return p && (p.id || p.producto_id || p.uuid || null);
}

describe('tienda eliminar correcto', () => {
  it('DELETE /api/tienda/:id por ADMIN → 200/204', async () => {
    // Usuario dueño crea producto
    const owner = request.agent(app);
    const emailOwner = `tienda.owner.delete+${Date.now()}@test.com`;

    await owner.post('/api/users/register').send({
      nombre: 'Owner',
      apellidos: 'Delete',
      email: emailOwner,
      password: 'Abcdef1!'
    });

    await owner.post('/api/users/login').send({
      email: emailOwner,
      password: 'Abcdef1!'
    });

    await owner.post('/api/tienda').send({
      nombre: 'Prod borrar',
      precio: 10,
      categoria: 'Temp',
      stock: 1,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    const resMine = await owner.get('/api/tienda/mis');
    const list = pickList(resMine.body);
    expect(list.length).toBeGreaterThan(0);

    const id = pickId(list[list.length - 1]);
    expect(id).not.toBeNull();

    // Admin
    const admin = request.agent(app);
    const emailAdmin = `tienda.admin.delete+${Date.now()}@test.com`;

    await admin.post('/api/users/register').send({
      nombre: 'Admin',
      apellidos: 'Delete',
      email: emailAdmin,
      password: 'Abcdef1!'
    });

    // Hacer admin en BD antes del login
    await run('UPDATE users SET rol="admin" WHERE email=?', [emailAdmin]);

    await admin.post('/api/users/login').send({
      email: emailAdmin,
      password: 'Abcdef1!'
    });

    const res = await admin.delete(`/api/tienda/${id}`);
    expect([200, 204]).toContain(res.status);
  });
});
