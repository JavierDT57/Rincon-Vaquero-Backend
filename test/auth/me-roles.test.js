const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const run = (sql, params=[]) =>
  new Promise((resolve, reject) => db.run(sql, params, function (e) { e ? reject(e) : resolve(this.lastID); }));


function pickUser(body) {
  if (body?.user) return body.user;
  if (body?.data?.user) return body.data.user;
  if (body?.data && body.data.email) return body.data; 
  if (body && body.email) return body;                 
  return null;
}

describe('/api/users/me roles', () => {
  it('me sin login → 401 (sin rol)', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('me como usuario (rol=usuario) → 200', async () => {
    const agent = request.agent(app);
    const email = `me.user+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });
    await agent.post('/api/users/login').send({ email, password: 'Abcdef1!' });

    const me = await agent.get('/api/users/me');
    expect(me.status).toBe(200);
    const user = pickUser(me.body);
    expect(user?.email).toBe(email);
    expect(user?.rol).toBe('usuario'); 
  });

  it('me como admin (rol=admin) → 200', async () => {
    const agent = request.agent(app);
    const email = `me.admin+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({
      nombre: 'Admin', apellidos: 'Test', email, password: 'Abcdef1!'
    });
    await run('UPDATE users SET rol = "admin" WHERE email = ?', [email]);
    await agent.post('/api/users/login').send({ email, password: 'Abcdef1!' });

    const me = await agent.get('/api/users/me');
    expect(me.status).toBe(200);
    const user = pickUser(me.body);
    expect(user?.email).toBe(email);
    expect(user?.rol).toBe('admin');
  });
});
