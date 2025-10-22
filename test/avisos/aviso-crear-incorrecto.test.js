// test/avisos/aviso-crear-incorrecto.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('aviso crear incorrecto', () => {
  it('POST /api/avisos sin login → 401/403', async () => {
    const res = await request(app).post('/api/avisos').send({ titulo:'X', texto:'Y' });
    expect([401,403]).toContain(res.status);
  });

  it('POST /api/avisos como usuario (no admin) → 403/401', async () => {
    const user = request.agent(app);
    const email = `aviso.cre.bad+${Date.now()}@test.com`;

    await user.post('/api/users/register').send({ nombre:'User', apellidos:'Test', email, password:'Abcdef1!' });
    await user.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const res = await user.post('/api/avisos').send({ titulo:'X', texto:'Y' });
    expect([403,401]).toContain(res.status);
  });
});
