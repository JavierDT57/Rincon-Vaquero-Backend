const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));

describe('testimonio eliminar incorrecto', () => {
  it('DELETE /api/testimonios/:id (usuario no admin) devuelve 403', async () => {
    const agent = request.agent(app);
    const email = `del.user+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({ nombre:'User', apellidos:'Test', email, password:'Abcdef1!' });
    await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });

    // crear testimonio
    await agent.post('/api/testimonios').send({
      nombre:'No Admin', comentario:'Probar delete', localidad:'BCS', rating:2
    });
    const row = await get('SELECT id FROM testimonios ORDER BY id DESC LIMIT 1');

    // intentar borrar sin ser admin
    const res = await agent.delete(`/api/testimonios/${row.id}`);
    expect([403,401]).toContain(res.status);
  });
});
