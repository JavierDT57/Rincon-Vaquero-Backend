const request = require('supertest');
const app = require('../../src/app');

describe('login correcto', () => {
  it('debe iniciar sesión con credenciales válidas', async () => {
    const agent = request.agent(app);
    const email = `login.ok+${Date.now()}@test.com`;

    // registro previo
    const reg = await agent.post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });
    expect([200,201,204]).toContain(reg.status);

    // login
    const res = await agent.post('/api/users/login').send({ email, password: 'Abcdef1!' });
    expect(res.status).toBe(200);

    // me autenticado
    const me = await agent.get('/api/users/me');
    expect(me.status).toBe(200);
    expect(me.body?.user?.email).toBe(email);
  });
});
