const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes cambiar por otro proveedor si quieres
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
