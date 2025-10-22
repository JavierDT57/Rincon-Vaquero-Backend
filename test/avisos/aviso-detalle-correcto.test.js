const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));

function pickId(body){
  return body?.data?.id ?? body?.aviso?.id ?? body?.id ?? null;
}

describe('aviso detalle correcto', () => {
  it('GET /api/avisos/:id devuelve 200 y el objeto', async () => {
    const admin = request.agent(app);
    const email = `aviso.det.ok+${Date.now()}@test.com`;
    await admin.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
    await new Promise((res, rej)=>db.run('UPDATE users SET rol="admin" WHERE email=?',[email],e=>e?rej(e):res()));
    await admin.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const cre = await admin.post('/api/avisos').send({ titulo:'Aviso X', texto:'Detalle OK' }); 
    expect([200,201,204]).toContain(cre.status);

    const id = pickId(cre.body) || (await get('SELECT id FROM avisos ORDER BY id DESC LIMIT 1'))?.id;
    const res = await request(app).get(`/api/avisos/${id}`);
    expect(res.status).toBe(200);

    const one = res.body?.data ?? res.body?.aviso ?? res.body;
    expect(one?.id).toBe(id);
  });
});
