const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));

function pickOne(body) {
  if (body && typeof body === 'object' && body.id != null) return body;
  if (body?.data?.id != null) return body.data;
  if (body?.item?.id != null) return body.item;
  if (body?.testimonio?.id != null) return body.testimonio; // <- caso común
  return null;
}

describe('testimonio detalle correcto', () => {
  it('GET /api/testimonios/:id devuelve 200 y el objeto', async () => {
    const agent = request.agent(app);
    const email = `det.ok+${Date.now()}@test.com`;

    // registro + login
    await agent.post('/api/users/register').send({ nombre:'Javi', apellidos:'Tester', email, password:'Abcdef1!' });
    await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });

    // crear un testimonio para garantizar un id existente
    await agent.post('/api/testimonios').send({
      nombre:'Juan', comentario:'Muy bien', localidad:'CDMX', rating:5
    });

    const row = await get('SELECT id FROM testimonios ORDER BY id DESC LIMIT 1');

    const res = await request(app).get(`/api/testimonios/${row.id}`);
    expect(res.status).toBe(200);

    const one = pickOne(res.body);
    expect(one?.id).toBe(row.id);
  });
});
