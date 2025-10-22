const request = require('supertest');
const app = require('../../src/app');

describe('aviso detalle incorrecto', () => {
  it('GET /api/avisos/:id inexistente → 404/400', async () => {
    const res = await request(app).get('/api/avisos/999999');
    expect([404,400]).toContain(res.status);
  });
});
