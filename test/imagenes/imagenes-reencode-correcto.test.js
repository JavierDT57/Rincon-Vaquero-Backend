const { createAdminAgent, createUserAgent, tinyPngBuffer } = require('./utils');

function assert2xx(res, ctx) {
  if (![200,201,204].includes(res.status)) {
    
    console.log(`[DBG reencode ${ctx}]`, res.status, res.body);
  }
  expect([200,201,204]).toContain(res.status);
}

describe('imagenes 06 re-encode OK', () => {
  it('avisos: admin sube y obtiene 2xx', async () => {
    const { agent } = await createAdminAgent();
    const r = await agent.post('/api/avisos')
      .field('titulo','Reencode OK')
      .field('texto','Texto suficientemente largo para pasar validaciones.')
      .attach('imagen', tinyPngBuffer(), { filename:'ok.png', contentType:'image/png' });
    assert2xx(r, 'avisos-admin');
  });

  it('testimonios: user sube y obtiene 2xx', async () => {
    const { agent } = await createUserAgent();
    const r = await agent.post('/api/testimonios')
      .field('nombre','Ana Prueba')
      .field('comentario','Comentario válido con longitud suficiente para validaciones.')
      .field('localidad','Monterrey')
      .field('rating','5')
      .attach('imagen', tinyPngBuffer(), { filename:'ok.png', contentType:'image/png' });
    assert2xx(r, 'testimonios-user');
  });
});
