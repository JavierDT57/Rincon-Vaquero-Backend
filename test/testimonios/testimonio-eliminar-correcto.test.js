const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const run = (sql, params=[]) =>
  new Promise((resolve, reject) => db.run(sql, params, function(e){ e ? reject(e) : resolve(this.lastID); }));
const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));

describe('testimonio eliminar correcto', () => {
  it('DELETE /api/testimonios/:id (admin) devuelve 200/204', async () => {
    const agent = request.agent(app);
    const email = `del.admin+${Date.now()}@test.com`;

    // admin
    await agent.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
    await run('UPDATE users SET rol = "admin" WHERE email = ?', [email]);
    await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });

    // crear testimonio
    await agent.post('/api/testimonios').send({
      nombre:'Borrar', comentario:'Será eliminado', localidad:'SLP', rating:1
    });
    const row = await get('SELECT id FROM testimonios ORDER BY id DESC LIMIT 1');

    // eliminar
    const res = await agent.delete(`/api/testimonios/${row.id}`);
    expect([200,204]).toContain(res.status);
  });
});
