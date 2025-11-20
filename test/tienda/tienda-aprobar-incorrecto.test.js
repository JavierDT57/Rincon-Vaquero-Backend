const request = require('supertest');
const app = require('../../src/app');

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

describe('tienda aprobar INCORRECTO', () => {
  it('PATCH /api/tienda/admin/:id/approve por usuario NO admin → 401/403 (o 404)', async () => {
    // Dueño crea producto pendiente
    const owner = request.agent(app);
    const emailOwner = `tienda.owner.approve+${Date.now()}@test.com`;

    await owner.post('/api/users/register').send({
      nombre: 'Owner',
      apellidos: 'Approve',
      email: emailOwner,
      password: 'Abcdef1!'
    });

    await owner.post('/api/users/login').send({
      email: emailOwner,
      password: 'Abcdef1!'
    });

    await owner.post('/api/tienda').send({
      nombre: 'Producto pendiente',
      precio: 500,
      categoria: 'Pendiente',
      stock: 1,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    const resMine = await owner.get('/api/tienda/mis');
    const list = pickList(resMine.body);
    expect(list.length).toBeGreaterThan(0);

    const id = pickId(list[list.length - 1]);
    expect(id).not.toBeNull();

    // Otro usuario NO admin
    const other = request.agent(app);
    const emailOther = `tienda.other.approve+${Date.now()}@test.com`;

    await other.post('/api/users/register').send({
      nombre: 'Other',
      apellidos: 'User',
      email: emailOther,
      password: 'Abcdef1!'
    });

    await other.post('/api/users/login').send({
      email: emailOther,
      password: 'Abcdef1!'
    });

    const res = await other.patch(`/api/tienda/admin/${id}/approve`);

    // Si no es admin: lo esperado es 401/403.
    // Si por alguna razón el producto ya no está, puede ser 404.
    expect([401, 403, 404]).toContain(res.status);
  });
});
