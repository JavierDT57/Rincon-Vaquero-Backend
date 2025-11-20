const request = require('supertest');
const app = require('../../src/app');

describe('tienda crear incorrecto', () => {
  it('POST /api/tienda sin login devuelve 401/403', async () => {
    const res = await request(app).post('/api/tienda').send({
      nombre: 'Sin login',
      precio: 999,
      categoria: 'Test',
      stock: 1,
      ubicacion: 'Puebla',
      telefono: '+522221234567'
    });

    expect([401, 403]).toContain(res.status);
  });
});
