const request = require('supertest');
const app = require('../../src/app');

function pickList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.testimonios)) return body.testimonios; 
  return null;
}

describe('testimonios lista correcto', () => {
  it('GET /api/testimonios devuelve 200 y una lista (puede estar vacía)', async () => {
    const res = await request(app).get('/api/testimonios');
    expect(res.status).toBe(200);

    const list = pickList(res.body);
    expect(Array.isArray(list)).toBe(true);
  });
});
