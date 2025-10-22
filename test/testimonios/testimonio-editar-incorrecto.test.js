const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));

describe('testimonio editar incorrecto', () => {
  it('PUT /api/testimonios/:id (usuario no admin) devuelve 403', async () => {
    const agent = request.agent(app);
    const email = `edit.user+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({ nombre:'User', apellidos:'Test', email, password:'Abcdef1!' });
    await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });

    // crear uno para tener id
    await agent.post('/api/testimonios').send({
      nombre:'Maria', comentario:'Mi comentario', localidad:'QRO', rating:4
    });
    const row = await get('SELECT id FROM testimonios ORDER BY id DESC LIMIT 1');

    // intentar editar sin ser admin
    const res = await agent.put(`/api/testimonios/${row.id}`).send({
      comentario:'No debería poder', rating:2
    });
    expect([403,401]).toContain(res.status);
  });
});
