const nodemailer = require('nodemailer');

let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const getTransporter = () => {
  if (!transporter) {
    initializeTransporter();
  }
  return transporter;
};

module.exports = {
  initializeTransporter,
  getTransporter
};
