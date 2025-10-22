const request = require('supertest');
const app = require('../../src/app');

describe('testimonio detalle incorrecto', () => {
  it('GET /api/testimonios/:id devuelve 404 para id inexistente', async () => {
    const res = await request(app).get('/api/testimonios/999999');
    expect([404,400]).toContain(res.status); 
  });
});
