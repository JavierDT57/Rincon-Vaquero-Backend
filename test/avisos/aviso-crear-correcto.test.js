const request = require('supertest');
const app = require('../../src/app');

describe('aviso crear correcto', () => {
  it('POST /api/avisos (admin) → 200/201/204', async () => {
    const admin = request.agent(app);
    const email = `aviso.cre.ok+${Date.now()}@test.com`;

    await admin.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
    const db = require('../../src/config/db');
    await new Promise((res, rej)=>db.run('UPDATE users SET rol="admin" WHERE email=?',[email],e=>e?rej(e):res()));
    await admin.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const res = await admin.post('/api/avisos').send({ titulo:'Aviso nuevo', texto:'Creado por admin' }); 
    expect([200,201,204]).toContain(res.status);
  });
});
