const request = require('supertest');
const app = require('../../src/app');

describe('registro incorrecto', () => {
  it('rechaza email duplicado (o valida 4xx)', async () => {
    const email = `reg.bad+${Date.now()}@test.com`;

    // primer registro ok
    await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });

    // segundo registro mismo email
    const res = await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });

    
    expect([400,409,422]).toContain(res.status);
  });
});
