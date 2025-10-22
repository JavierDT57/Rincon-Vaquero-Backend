const request = require('supertest');
const app = require('../../src/app');

describe('dashboard editar incorrecto', () => {
  it('PUT /api/dashboard/:slug sin login → 401/403', async () => {
    const slug = 'sin-login-' + Date.now();
    const res = await request(app).put(`/api/dashboard/${slug}`).send({ value: 'x' });
    expect([401,403]).toContain(res.status);
  });

  it('PUT /api/dashboard/:slug como usuario (no admin) → 403/401', async () => {
    const user = request.agent(app);
    const email = `dash.ed.bad+${Date.now()}@test.com`;

    await user.post('/api/users/register').send({ nombre:'User', apellidos:'Test', email, password:'Abcdef1!' });
    await user.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const slug = 'no-admin-' + Date.now();
    const res = await user.put(`/api/dashboard/${slug}`).send({ value: 'x' });
    expect([403,401]).toContain(res.status);
  });
});
