const request = require('supertest');
const app = require('../../src/app');

describe('recuperar-solicitud incorrecto', () => {
  it('no filtra existencia (o responde 404 según política)', async () => {
    const email = `no-existe+${Date.now()}@test.com`;

    const res = await request(app).post('/api/users/recover/request').send({ email });
    
    expect([200,202,204,404]).toContain(res.status);
  });
});
