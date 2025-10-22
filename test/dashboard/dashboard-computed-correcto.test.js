const request = require('supertest');
const app = require('../../src/app');

function pickComputed(body) {
  if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  if (body?.data && typeof body.data === 'object') return body.data;
  if (body?.dashboard && typeof body.dashboard === 'object') return body.dashboard;
  return null;
}

describe('dashboard computed correcto', () => {
  it('GET /api/dashboard/computed → 200 y objeto', async () => {
    const res = await request(app).get('/api/dashboard/computed');
    expect(res.status).toBe(200);
    const obj = pickComputed(res.body);
    expect(typeof obj).toBe('object');
    expect(Array.isArray(obj)).toBe(false);
  });
});
