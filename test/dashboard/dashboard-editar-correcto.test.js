const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const run = (sql, params=[]) =>
  new Promise((resolve, reject) => db.run(sql, params, function(e){ e ? reject(e) : resolve(this.lastID); }));

describe('dashboard editar correcto', () => {
  it('PUT /api/dashboard/:slug (admin) → autorizado (no 401/403)', async () => {
    const agent = request.agent(app);
    const email = `dash.ed.ok+${Date.now()}@test.com`;

    // crear admin y loguear
    await agent.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
    await run('UPDATE users SET rol="admin" WHERE email=?', [email]);
    await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const slug = 'seccion-prueba-' + Date.now();

    // Intento de edición 
    const res = await agent.put(`/api/dashboard/${slug}`).send({
      title: 'Nuevo título',
      texto: 'Contenido actualizado',
      data: { foo: 'bar' },
      json: { any: 'thing' },
      value: 'v'
    });

    
    expect([200,201,202,204,400,404,422]).toContain(res.status);
    expect([401,403]).not.toContain(res.status);
  });
});
