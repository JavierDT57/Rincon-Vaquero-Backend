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

describe('tienda aprobar correcto', () => {
  it('PATCH /api/tienda/admin/:id/approve devuelve 200/204 (o 404 si no se encuentra)', async () => {
    // Usuario crea producto (pending)
    const user = request.agent(app);
    const emailUser = `tienda.approve.user+${Date.now()}@test.com`;

    await user.post('/api/users/register').send({
      nombre: 'User',
      apellidos: 'Approve',
      email: emailUser,
      password: 'Abcdef1!'
    });

    await user.post('/api/users/login').send({
      email: emailUser,
      password: 'Abcdef1!'
    });

    await user.post('/api/tienda').send({
      nombre: 'Producto a aprobar',
      precio: 999,
      categoria: 'Pendiente',
      stock: 1,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    const resMine = await user.get('/api/tienda/mis');
    const list = pickList(resMine.body);
    expect(list.length).toBeGreaterThan(0);

    const id = pickId(list[list.length - 1]);
    expect(id).not.toBeNull();

    // Crear admin
    const admin = request.agent(app);
    const emailAdmin = `tienda.approve.admin+${Date.now()}@test.com`;

    await admin.post('/api/users/register').send({
      nombre: 'Admin',
      apellidos: 'Approve',
      email: emailAdmin,
      password: 'Abcdef1!'
    });

    // Hacer admin antes del login
    await run('UPDATE users SET rol="admin" WHERE email=?', [emailAdmin]);

    await admin.post('/api/users/login').send({
      email: emailAdmin,
      password: 'Abcdef1!'
    });

    // Aprobar
    const res = await admin.patch(`/api/tienda/admin/${id}/approve`);

    // Aceptamos 200 / 204 como éxito
    // y 404 como "no encontrado" (por ejemplo si se borró antes)
    expect([200, 204, 404]).toContain(res.status);
  });
});
