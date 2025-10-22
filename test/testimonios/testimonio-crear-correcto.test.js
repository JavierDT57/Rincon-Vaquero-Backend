const request = require('supertest');
const app = require('../../src/app');

describe('testimonio crear correcto', () => {
  it('POST /api/testimonios (logueado) devuelve 200/201', async () => {
    const agent = request.agent(app);
    const email = `cre.ok+${Date.now()}@test.com`;

    await agent.post('/api/users/register').send({ nombre:'Javi', apellidos:'Tester', email, password:'Abcdef1!' });
    await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });

    const res = await agent.post('/api/testimonios').send({
      nombre:'Ana', comentario:'Excelente', localidad:'GDL', rating:4
    });
    expect([200,201,204]).toContain(res.status);
  });
});
