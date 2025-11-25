// server.js
require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
  if (err) {
    console.error("Error al iniciar servidor:", err);
    process.exit(1);
  }
  console.log(` Servidor escuchando en puerto ${PORT}`);
});
