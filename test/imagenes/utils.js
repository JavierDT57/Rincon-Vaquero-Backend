// test/imagenes/utils.js
const request = require('supertest');
const db = require('../../src/config/db');
const app = require('../../src/app');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');

const run = (sql, params=[]) =>
  new Promise((resolve, reject) => db.run(sql, params, function(e){ e ? reject(e) : resolve(this.lastID); }));

async function createAdminAgent() {
  const agent = request.agent(app);
  const email = `admin+${Date.now()}@test.com`;
  await agent.post('/api/users/register').send({ nombre:'Admin', apellidos:'Test', email, password:'Abcdef1!' });
  await run('UPDATE users SET rol="admin" WHERE email=?', [email]);
  await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });
  return { agent, email };
}
async function createUserAgent() {
  const agent = request.agent(app);
  const email = `user+${Date.now()}@test.com`;
  await agent.post('/api/users/register').send({ nombre:'User', apellidos:'Test', email, password:'Abcdef1!' });
  await agent.post('/api/users/login').send({ email, password:'Abcdef1!' });
  return { agent, email };
}

// ----- buffers “de laboratorio” -----
const TINY_PNG_BASE64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
function tinyPngBuffer(){ return Buffer.from(TINY_PNG_BASE64,'base64'); }
function fakeJpgBuffer(){ return Buffer.from('<html><body>NOT AN IMAGE</body></html>','utf8'); }
function bigBufferMB(mb=11){ return Buffer.alloc(mb*1024*1024,0); }

// ----- FS helpers -----
function walk(dir, acc=[]){
  for(const name of fs.readdirSync(dir, { withFileTypes:true })){
    const p = path.join(dir, name.name);
    if(name.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}
function findLatestFile(root=UPLOADS_DIR){
  if(!fs.existsSync(root)) return null;
  const files = walk(root).filter(p=>/\.(png|jpe?g|webp)$/i.test(p));
  if(!files.length) return null;
  files.sort((a,b)=>fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}
function readFile(p){ try{ return fs.readFileSync(p); } catch{ return null; } }

// Intenta extraer una ruta de imagen de la respuesta (si tu API la devuelve)
function pickSavedPathFromBody(body){
  // casos comunes:
  const cands = [];
  const pushIfStr = (v)=>{ if(typeof v==='string') cands.push(v); };
  // buscar recursivo ligero
  const stack=[body];
  const seen=new Set();
  while(stack.length){
    const x=stack.pop();
    if(!x || typeof x!=='object' || seen.has(x)) continue;
    seen.add(x);
    for(const k of Object.keys(x)){
      const v=x[k];
      if(typeof v==='string' && /\.(png|jpe?g|webp)$/i.test(v)) pushIfStr(v);
      else if(v && typeof v==='object') stack.push(v);
    }
  }
  return cands.find(s=>s.includes('/uploads/') || /\.(png|jpe?g|webp)$/i.test(s)) || null;
}

module.exports = {
  app,
  createAdminAgent,
  createUserAgent,
  tinyPngBuffer,
  fakeJpgBuffer,
  bigBufferMB,
  UPLOADS_DIR,
  findLatestFile,
  readFile,
  pickSavedPathFromBody,
};
