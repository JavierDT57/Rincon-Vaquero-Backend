const request = require('supertest');
const app = require('../../src/app');

function pickList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.productos)) return body.productos;
  if (Array.isArray(body.tienda)) return body.tienda;
  return [];
}

describe('tienda lista correcto', () => {
  it('GET /api/tienda (logueado) devuelve 200 y una lista (puede estar vacía)', async () => {
    const agent = request.agent(app);
    const email = `tienda.lista+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({
      nombre: 'User',
      apellidos: 'Lista',
      email,
      password: 'Abcdef1!'
    });

    await agent.post('/api/users/login').send({ email, password: 'Abcdef1!' });

    const res = await agent.get('/api/tienda');
    expect(res.status).toBe(200);

    const list = pickList(res.body);
    expect(Array.isArray(list)).toBe(true);
  });
});
