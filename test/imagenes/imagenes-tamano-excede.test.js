const { createAdminAgent, createUserAgent, bigBufferMB } = require('./utils');

describe('imagenes 03 tamaño excede', () => {
  it('avisos: >10MB → 413/400', async () => {
    const { agent } = await createAdminAgent();
    const r = await agent.post('/api/avisos')
      .field('titulo','Grande').field('texto','Z')
      .attach('imagen', bigBufferMB(11), { filename:'big.jpg', contentType:'image/jpeg' });
    expect([413,400]).toContain(r.status);
  });

  it('testimonios: >10MB → 413/400', async () => {
    const { agent } = await createUserAgent();
    const r = await agent.post('/api/testimonios')
      .field('nombre','N').field('comentario','C').field('localidad','L').field('rating','5')
      .attach('imagenurl', bigBufferMB(11), { filename:'big.jpg', contentType:'image/jpeg' });
    expect([413,400]).toContain(r.status);
  });
});
