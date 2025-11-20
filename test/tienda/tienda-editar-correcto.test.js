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

describe('tienda editar correcto', () => {
  it('PUT /api/tienda/:id (dueño) devuelve 200/204', async () => {
    const agent = request.agent(app);
    const email = `tienda.edit.ok+${Date.now()}@test.com`;

    // Crear usuario dueño
    await agent.post('/api/users/register').send({
      nombre: 'Owner',
      apellidos: 'Edit',
      email,
      password: 'Abcdef1!'
    });

    await agent.post('/api/users/login').send({
      email,
      password: 'Abcdef1!'
    });

    // Crear producto
    await agent.post('/api/tienda').send({
      nombre: 'Producto original',
      precio: 150,
      categoria: 'Original',
      stock: 3,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    // Obtener lista de productos del dueño
    const resMine = await agent.get('/api/tienda/mis');
    const list = pickList(resMine.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    const id = pickId(list[list.length - 1]);
    expect(id).not.toBeNull();

    // Editar producto (p.ej. solo precio y nombre)
    const res = await agent.put(`/api/tienda/${id}`).send({
      nombre: 'Producto actualizado',
      precio: 250
    });

    expect([200, 204]).toContain(res.status);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.precio).toBe(250);
  });
});
