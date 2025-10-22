const request = require('supertest');
const app = require('../../src/app');

describe('login incorrecto', () => {
  it('rechaza contraseña inválida', async () => {
    const email = `login.bad+${Date.now()}@test.com`;

    // registro previo
    await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });

    // login con password malo
    const res = await request(app).post('/api/users/login').send({ email, password: 'incorrecta' });
    expect(res.status).toBe(401);
  });
});
