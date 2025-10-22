const request = require('supertest');
const app = require('../../src/app');

describe('logout incorrecto', () => {
  it('sin sesión previa devuelve 401 (o 200 si tu API es idempotente)', async () => {
    const res = await request(app).post('/api/users/logout');
    
    expect([200,401]).toContain(res.status);
  });
});
