// test/auth/verificar-incorrecto.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('recuperar-verificar-confirmar incorrecto', () => {
  it('rechaza token inválido al verificar', async () => {
    const email = `rec.bad.verify+${Date.now()}@test.com`;

    // Crear usuario y solicitar recuperación 
    await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });
    await request(app).post('/api/users/recover/request').send({ email });

    // Verificar con token incorrecto 
    const bad = await request(app)
      .post('/api/users/recover/verify')
      .send({ email, token: 'TOKEN_INVALIDO_X' });

    expect([400,401,404]).toContain(bad.status);
  });

  it('rechaza token inválido al confirmar', async () => {
    const email = `rec.bad.confirm+${Date.now()}@test.com`;

    // Crear usuario y solicitar recuperación 
    await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });
    await request(app).post('/api/users/recover/request').send({ email });

    // Confirmar con token incorrecto 
    const res = await request(app)
      .post('/api/users/recover/confirm')
      .send({
        email,
        token: 'TOKEN_INVALIDO_X',
        newPassword: 'Nueva123!',
        confirmPassword: 'Nueva123!',
      });

    expect([400,401,404]).toContain(res.status);
  });
});
