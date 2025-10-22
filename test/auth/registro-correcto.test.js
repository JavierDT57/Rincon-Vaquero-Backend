const request = require('supertest');
const app = require('../../src/app');

describe('registro correcto', () => {
  it('crea usuario con datos válidos', async () => {
    const email = `reg.ok+${Date.now()}@test.com`;
    const res = await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });
    expect([200,201,204]).toContain(res.status);
  });
});
