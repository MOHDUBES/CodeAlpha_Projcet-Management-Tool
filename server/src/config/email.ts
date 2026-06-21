import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

export const transporter = createTransporter();

export const verifyEmailConnection = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      await transporter.verify();
      logger.info('Email transporter connected');
    }
  } catch (error) {
    logger.warn(`Email transporter not connected: ${error}`);
  }
};

export default transporter;
