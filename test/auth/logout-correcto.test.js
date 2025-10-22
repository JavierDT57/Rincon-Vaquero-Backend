const request = require('supertest');
const app = require('../../src/app');

describe('logout correcto', () => {
  it('cierra sesión y ya no permite /me', async () => {
    const agent = request.agent(app);
    const email = `logout.ok+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });
    await agent.post('/api/users/login').send({ email, password: 'Abcdef1!' });

    const out = await agent.post('/api/users/logout');
    expect(out.status).toBe(200);

    const me = await agent.get('/api/users/me');
    expect(me.status).toBe(401);
  });
});
