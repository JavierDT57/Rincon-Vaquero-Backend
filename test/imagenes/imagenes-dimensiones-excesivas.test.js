const sharp = require('sharp');
const { createAdminAgent, createUserAgent } = require('./utils');

async function bigWebpBuffer(){
  // 31MP: 6200 x 5000
  return sharp({
    create: { width: 6200, height: 5000, channels: 3, background: { r:255,g:255,b:255 } }
  }).webp({ quality: 5 }).toBuffer();
}

describe('imagenes 08 dimensiones excesivas', () => {
  it('avisos: >30MP → 413 (o 400 según handler)', async () => {
    const { agent } = await createAdminAgent();
    const big = await bigWebpBuffer();
    const r = await agent.post('/api/avisos')
      .field('titulo','Big').field('texto','Dims')
      .attach('imagen', big, { filename:'big.webp', contentType:'image/webp' });
    expect([413,400]).toContain(r.status);
  });

  it('testimonios: >30MP → 413 (o 400)', async () => {
    const { agent } = await createUserAgent();
    const big = await bigWebpBuffer();
    const r = await agent.post('/api/testimonios')
      .field('nombre','Big').field('comentario','Dims').field('localidad','SLP').field('rating','5')
      .attach('imagenurl', big, { filename:'big.webp', contentType:'image/webp' });
    expect([413,400]).toContain(r.status);
  });
});
