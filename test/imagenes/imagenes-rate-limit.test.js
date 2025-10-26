const { createUserAgent, createAdminAgent, tinyPngBuffer } = require('./utils');

describe('imagenes 05 rate-limit', () => {
  it('testimonios: 11 subidas en <60s → alguna 429', async () => {
    const { agent } = await createUserAgent();
    let hits429 = 0;
    for(let i=1;i<=11;i++){
      const r = await agent.post('/api/testimonios')
        .field('nombre',`N${i}`).field('comentario',`C${i}`).field('localidad','QRO').field('rating','5')
        .attach('imagenurl', tinyPngBuffer(), { filename:`t${i}.png`, contentType:'image/png' });
      if(r.status===429) hits429++;
    }
    expect(hits429).toBeGreaterThanOrEqual(1);
  });

  it('avisos (admin): 11 subidas → alguna 429', async () => {
    const { agent } = await createAdminAgent();
    let hits429 = 0;
    for(let i=1;i<=11;i++){
      const r = await agent.post('/api/avisos')
        .field('titulo',`A${i}`).field('texto','RL')
        .attach('imagen', tinyPngBuffer(), { filename:`a${i}.png`, contentType:'image/png' });
      if(r.status===429) hits429++;
    }
    expect(hits429).toBeGreaterThanOrEqual(1);
  });
});
