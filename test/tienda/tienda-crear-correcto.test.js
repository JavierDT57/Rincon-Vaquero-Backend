const request = require('supertest');
const app = require('../../src/app');

describe('tienda crear correcto', () => {
  it('POST /api/tienda (logueado) devuelve 200/201/204', async () => {
    const agent = request.agent(app);
    const email = `tienda.crear.ok+${Date.now()}@test.com`;

    // Registrar usuario
    await agent.post('/api/users/register').send({
      nombre: 'User',
      apellidos: 'Tienda',
      email,
      password: 'Abcdef1!'
    });

    // Login
    await agent.post('/api/users/login').send({
      email,
      password: 'Abcdef1!'
    });

    // Crear producto con los campos correctos
    const res = await agent.post('/api/tienda').send({
      nombre: 'Producto prueba',
      precio: 100,
      categoria: 'Pruebas',
      stock: 5,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    expect([200, 201, 204]).toContain(res.status);
    expect(res.body).toBeDefined();
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
  });
});
