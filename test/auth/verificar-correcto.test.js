// test/auth/verificar-correcto.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));

async function fetchTokenByEmail(email) {
  // 1) users.reset_token / reset_expires (tu implementación actual)
  try {
    const r = await get('SELECT reset_token AS token FROM users WHERE email = ? LIMIT 1', [email]);
    if (r?.token) return r.token;
  } catch {}
  // 2) fallback a tabla password_resets si existe
  try {
    const r = await get('SELECT token FROM password_resets ORDER BY id DESC LIMIT 1');
    if (r?.token) return r.token;
  } catch {}
  throw new Error('No se encontró token; ajusta la consulta a tu esquema.');
}

describe('recuperar-verificar-confirmar correcto', () => {
  it('verifica token y cambia password con token válido', async () => {
    const email = `rec.flow.ok+${Date.now()}@test.com`;
    const newPass = 'NewPass1!'; // cumple validatePassword

    // registro
    await request(app).post('/api/users/register').send({
      nombre: 'Javi', apellidos: 'Tester', email, password: 'Abcdef1!'
    });

    // genera token
    await request(app).post('/api/users/recover/request').send({ email });

    // obtener token desde DB
    const token = await fetchTokenByEmail(email);

    // verificar
    const v = await request(app).post('/api/users/recover/verify').send({ email, token });
    expect([200, 204]).toContain(v.status);

    // confirmar
    const c = await request(app)
      .post('/api/users/recover/confirm')
      .send({ email, token, newPassword: newPass, confirmPassword: newPass });

    expect([200, 204]).toContain(c.status);

    // login con la nueva contraseña
    const login = await request(app).post('/api/users/login').send({ email, password: newPass });
    expect(login.status).toBe(200);
  });
});
