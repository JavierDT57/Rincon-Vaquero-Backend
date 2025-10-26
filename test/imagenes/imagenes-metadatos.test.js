const { createAdminAgent, createUserAgent, tinyPngBuffer, UPLOADS_DIR, findLatestFile, readFile, pickSavedPathFromBody } = require('./utils');
const path = require('path');

function assert2xx(res, ctx) {
  if (![200,201,204].includes(res.status)) {
    
    console.log(`[DBG metadatos ${ctx}]`, res.status, res.body);
  }
  expect([200,201,204]).toContain(res.status);
}

describe('imagenes 07 metadatos', () => {
  it('avisos: salida sin EXIF (re-encode)', async () => {
    const { agent } = await createAdminAgent();
    const res = await agent.post('/api/avisos')
      .field('titulo','Meta Aviso')
      .field('texto','Texto de prueba con longitud suficiente para validar.')
      .attach('imagen', tinyPngBuffer(), { filename:'meta.png', contentType:'image/png' });

    assert2xx(res, 'avisos');

    let p = pickSavedPathFromBody(res.body);
    if (p && !path.isAbsolute(p)) p = path.join(UPLOADS_DIR, p.split('/uploads/').pop() || '');
    const filePath = p && readFile(p) ? p : findLatestFile(UPLOADS_DIR);
    const buf = readFile(filePath);
    expect(buf).toBeTruthy();

    if (/\.(jpe?g)$/i.test(filePath)) {
      expect(buf.includes(Buffer.from('45786966','hex'))).toBe(false); 
    }
  });

  it('testimonios: salida sin EXIF (re-encode)', async () => {
    const { agent } = await createUserAgent();
    const res = await agent.post('/api/testimonios')
      .field('nombre','Meta User')
      .field('comentario','Comentario de prueba suficientemente largo para validar.')
      .field('localidad','CDMX')
      .field('rating','5')
      .attach('imagen', tinyPngBuffer(), { filename:'meta.png', contentType:'image/png' });

    assert2xx(res, 'testimonios');

    let p = pickSavedPathFromBody(res.body);
    if (p && !path.isAbsolute(p)) p = path.join(UPLOADS_DIR, p.split('/uploads/').pop() || '');
    const filePath = p && readFile(p) ? p : findLatestFile(UPLOADS_DIR);
    const buf = readFile(filePath);
    expect(buf).toBeTruthy();

    if (/\.(jpe?g)$/i.test(filePath)) {
      expect(buf.includes(Buffer.from('45786966','hex'))).toBe(false);
    }
  });
});
