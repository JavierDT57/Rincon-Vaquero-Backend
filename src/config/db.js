const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../db/rinconvaquero.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite en:', dbPath);
  }
});

module.exports = db;   
