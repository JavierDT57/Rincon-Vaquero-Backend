const request = require('supertest');
const app = require('../../src/app');

describe('recuperar-solicitud correcto', () => {
  it('envía correo de recuperación para email existente', async () => {
    const email = `rec.ok+${Date.now()}@test.com`;

    // registro previo
    await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });

    // solicitud de recuperación
    const res = await request(app).post('/api/users/recover/request').send({ email });
    
    expect([200,202,204]).toContain(res.status);
  });
});
