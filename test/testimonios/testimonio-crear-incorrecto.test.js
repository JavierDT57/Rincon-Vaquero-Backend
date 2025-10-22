const request = require('supertest');
const app = require('../../src/app');

describe('testimonio crear incorrecto', () => {
  it('POST /api/testimonios sin login devuelve 401', async () => {
    const res = await request(app).post('/api/testimonios').send({
      nombre:'SinLogin', comentario:'No debería crear', localidad:'MTY', rating:3
    });
    expect([401,403]).toContain(res.status);
  });
});
