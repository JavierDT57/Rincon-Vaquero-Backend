const request = require('supertest');
const app = require('../../src/app');

function pickList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.avisos)) return body.avisos;
  return null;
}

describe('avisos lista correcto', () => {
  it('GET /api/avisos devuelve 200 y lista (vacía o con datos)', async () => {
    const res = await request(app).get('/api/avisos');
    expect(res.status).toBe(200);
    const list = pickList(res.body);
    expect(Array.isArray(list)).toBe(true);
  });
});
