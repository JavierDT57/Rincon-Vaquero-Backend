const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));
function pickId(b){ return b?.data?.id ?? b?.aviso?.id ?? b?.id ?? null; }

describe('aviso editar correcto', () => {
  it('PUT /api/avisos/:id (admin) → 200/204', async () => {
    const admin = request.agent(app);
    const email = `aviso.ed.ok+${Date.now()}@test.com`;

    await admin.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
    await new Promise((res, rej)=>db.run('UPDATE users SET rol="admin" WHERE email=?',[email],e=>e?rej(e):res()));
    await admin.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const cre = await admin.post('/api/avisos').send({ titulo:'Original', texto:'Para editar' }); 
    expect([200,201,204]).toContain(cre.status);
    const id = pickId(cre.body) || (await get('SELECT id FROM avisos ORDER BY id DESC LIMIT 1'))?.id;

    const res = await admin.put(`/api/avisos/${id}`).send({ texto:'Editado por admin' });
    expect([200,204]).toContain(res.status);
  });
});
