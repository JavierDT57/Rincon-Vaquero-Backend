const transporter = require('../config/mailer');

async function sendWelcomeMail({ to, nombre }) {
  return transporter.sendMail({
    from: `"Rincón Vaquero" <${process.env.EMAIL_USER}>`,
    to,
    subject: "¡Bienvenido a la comunidad de Rincón Vaquero!",
    html: `
      <h2>¡Hola ${nombre}!</h2>
      <p>Gracias por unirte a la comunidad de Rincón Vaquero.<br>
      Disfruta la pagina y ayuda a difundir lo mejor de nuestro pueblo.</p>
    `
  });
}

module.exports = { sendWelcomeMail };