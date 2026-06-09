import nodemailer from 'nodemailer';
import logger from './logger.js';
import { ConfigModel } from '../models/models.js';

const cfg = async (key, fallback) => {
  try {
    const val = await ConfigModel.get(key);
    return val || fallback;
  } catch {
    return fallback;
  }
};

export const sendMail = async ({ to, subject, html }) => {
  const [host, port, user, pass, secure] = await Promise.all([
    cfg('email_host',   process.env.EMAIL_HOST   || ''),
    cfg('email_port',   process.env.EMAIL_PORT   || '587'),
    cfg('email_user',   process.env.EMAIL_USER   || ''),
    cfg('email_pass',   process.env.EMAIL_PASS   || ''),
    cfg('email_secure', process.env.EMAIL_SECURE || 'false'),
  ]);

  if (!host || !user || !pass) {
    logger.warn('Email not configured — skipping notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: secure === 'true',
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Swazi Cultural Heritage" <${user}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent → ${to} | ${subject}`);
  } catch (err) {
    logger.error(`Email failed → ${to}: ${err.message}`);
  }
};
