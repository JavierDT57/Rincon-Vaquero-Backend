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

describe('tienda editar incorrecto', () => {
  it('PUT /api/tienda/:id por usuario NO dueño devuelve 401/403', async () => {
    // Dueño
    const owner = request.agent(app);
    const emailOwner = `tienda.owner.edit+${Date.now()}@test.com`;

    await owner.post('/api/users/register').send({
      nombre: 'Owner',
      apellidos: 'Edit',
      email: emailOwner,
      password: 'Abcdef1!'
    });

    await owner.post('/api/users/login').send({
      email: emailOwner,
      password: 'Abcdef1!'
    });

    await owner.post('/api/tienda').send({
      nombre: 'Producto dueño',
      precio: 300,
      categoria: 'Owner',
      stock: 2,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    const resMine = await owner.get('/api/tienda/mis');
    const list = pickList(resMine.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    const id = pickId(list[list.length - 1]);
    expect(id).not.toBeNull();

    // Otro usuario (no dueño, no admin)
    const other = request.agent(app);
    const emailOther = `tienda.other.edit+${Date.now()}@test.com`;

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

    const res = await other.put(`/api/tienda/${id}`).send({
      nombre: 'Hack intento',
      precio: 1
    });

    expect([401, 403]).toContain(res.status);
  });
});
