const { createAdminAgent, createUserAgent, tinyPngBuffer } = require('./utils');

function assert2xx(res, ctx) {
  if (![200,201,204].includes(res.status)) {
    
    console.log(`[DBG roles ${ctx}]`, res.status, res.body);
  }
  expect([200,201,204]).toContain(res.status);
}

describe('imagenes 02 roles', () => {
  it('avisos: admin sí puede crear (2xx), user NO (403/401)', async () => {
    const { agent: admin } = await createAdminAgent();
    const ok = await admin.post('/api/avisos')
      .field('titulo','Aviso de prueba')
      .field('texto','Contenido del aviso con longitud suficiente para validar.')
      .attach('imagen', tinyPngBuffer(), { filename:'a.png', contentType:'image/png' });
    assert2xx(ok, 'avisos-admin');

    const { agent: user } = await createUserAgent();
    const bad = await user.post('/api/avisos')
      .field('titulo','Aviso de prueba')
      .field('texto','Contenido del aviso con longitud suficiente para validar.')
      .attach('imagen', tinyPngBuffer(), { filename:'a.png', contentType:'image/png' });
    expect([401,403]).toContain(bad.status);
  });

  it('testimonios: user logueado sí puede (2xx)', async () => {
    const { agent: user } = await createUserAgent();
    const ok = await user.post('/api/testimonios')
      .field('nombre','Usuario Prueba')
      .field('comentario','Comentario válido con más de veinte caracteres para pasar.')
      .field('localidad','CDMX')
      .field('rating','5')
      
      .attach('imagen', tinyPngBuffer(), { filename:'t.png', contentType:'image/png' });
    assert2xx(ok, 'testimonios-user');
  });
});
