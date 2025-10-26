const { createAdminAgent, createUserAgent, fakeJpgBuffer } = require('./utils');

describe('imagenes 04 magic bytes', () => {
  it('avisos: HTML renombrado .jpg → 400', async () => {
    const { agent } = await createAdminAgent();
    const r = await agent.post('/api/avisos')
      .field('titulo','Camuflado').field('texto','X')
      .attach('imagen', fakeJpgBuffer(), { filename:'malo.jpg', contentType:'image/jpeg' });
    expect(r.status).toBe(400);
  });

  it('testimonios: HTML renombrado .jpg → 400', async () => {
    const { agent } = await createUserAgent();
    const r = await agent.post('/api/testimonios')
      .field('nombre','N').field('comentario','C').field('localidad','L').field('rating','5')
      .attach('imagenurl', fakeJpgBuffer(), { filename:'malo.jpg', contentType:'image/jpeg' });
    expect(r.status).toBe(400);
  });
});
