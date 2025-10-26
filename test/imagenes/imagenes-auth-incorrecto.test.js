const { app, tinyPngBuffer } = require('./utils');
const request = require('supertest');

describe('imagenes 01 auth incorrecto', () => {
  it('avisos: POST sin login → 401/403', async () => {
    const r = await request(app).post('/api/avisos')
      .field('titulo','X').field('texto','Y')
      .attach('imagen', tinyPngBuffer(), { filename:'a.png', contentType:'image/png' });
    expect([401,403]).toContain(r.status);
  });

  it('testimonios: POST sin login → 401/403', async () => {
    const r = await request(app).post('/api/testimonios')
      .field('nombre','N').field('comentario','C').field('localidad','L').field('rating','5')
      .attach('imagenurl', tinyPngBuffer(), { filename:'t.png', contentType:'image/png' });
    expect([401,403]).toContain(r.status);
  });
});
