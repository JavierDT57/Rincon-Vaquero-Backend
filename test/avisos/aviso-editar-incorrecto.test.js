const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));
const run = (sql, params=[]) =>
  new Promise((resolve, reject) => db.run(sql, params, function(e){ e ? reject(e) : resolve(this.lastID); }));
const pickId = b => b?.data?.id ?? b?.aviso?.id ?? b?.id ?? null;

describe('aviso editar incorrecto', () => {
  it('PUT /api/avisos/:id sin login → 401/403', async () => {
    const admin = request.agent(app);
    const email = `aviso.ed.bad.nologin+${Date.now()}@test.com`;
    await admin.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
    await run('UPDATE users SET rol="admin" WHERE email=?',[email]);
    await admin.post('/api/users/login').send({ email, password:'Abcdef1!' });
    const cre = await admin.post('/api/avisos').send({ titulo:'X', texto:'Y' }); // <-- texto
    expect([200,201,204]).toContain(cre.status);
    const id = pickId(cre.body) || (await get('SELECT id FROM avisos ORDER BY id DESC LIMIT 1'))?.id;

    const res = await request(app).put(`/api/avisos/${id}`).send({ texto:'No debería' }); 
    expect([401,403]).toContain(res.status);
  });

  it('PUT /api/avisos/:id como usuario (no admin) → 403/401', async () => {
    // crear aviso con admin
    const admin = request.agent(app);
    const aemail = `aviso.ed.bad.admin+${Date.now()}@test.com`;
    await admin.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email:aemail, password:'Abcdef1!' });
    await run('UPDATE users SET rol="admin" WHERE email=?',[aemail]);
    await admin.post('/api/users/login').send({ email:aemail, password:'Abcdef1!' });
    const cre = await admin.post('/api/avisos').send({ titulo:'X', texto:'Y' }); 
    expect([200,201,204]).toContain(cre.status);
    const id = pickId(cre.body) || (await get('SELECT id FROM avisos ORDER BY id DESC LIMIT 1'))?.id;

    // usuario normal intenta editar
    const user = request.agent(app);
    const uemail = `aviso.ed.bad.user+${Date.now()}@test.com`;
    await user.post('/api/users/register').send({ nombre:'User', apellidos:'Test', email:uemail, password:'Abcdef1!' });
    await user.post('/api/users/login').send({ email:uemail, password:'Abcdef1!' });

    const res = await user.put(`/api/avisos/${id}`).send({ texto:'No debería' }); 
    expect([403,401]).toContain(res.status);
  });
});
