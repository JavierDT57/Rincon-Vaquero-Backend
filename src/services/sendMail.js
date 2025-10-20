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

async function sendPasswordResetMail({ to, token }) {
  
  return transporter.sendMail({
    from: `"Rincón Vaquero" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Código de recuperación de contraseña",
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Usa este código para restablecer tu contraseña (expira en 15 minutos):</p>
      <div style="font-size:22px;font-weight:bold;letter-spacing:2px">${token}</div>
      <p>Si tú no solicitaste esto, ignora este correo.</p>
    `
  });
}

module.exports = { sendWelcomeMail, sendPasswordResetMail };