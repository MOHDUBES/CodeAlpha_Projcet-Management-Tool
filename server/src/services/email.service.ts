import transporter from '../config/email';
import logger from '../utils/logger';

const FROM = `${process.env.EMAIL_FROM_NAME || 'PM SaaS'} <${process.env.EMAIL_FROM || 'noreply@pm-saas.com'}>`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const baseEmailTemplate = (content: string, title: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px; }
    .body { padding: 40px; }
    .body p { color: #475569; line-height: 1.6; margin-bottom: 16px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .code { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 24px; font-weight: 700; color: #6366f1; text-align: center; letter-spacing: 4px; margin: 16px 0; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 13px; line-height: 1.5; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ PM SaaS</h1>
      <p>Project Management Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PM SaaS. All rights reserved.</p>
      <p style="margin-top:8px">If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${CLIENT_URL}/verify-email/${token}`;
  const content = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to PM SaaS! We're excited to have you on board. Please verify your email address to get started.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>
    <div class="divider"></div>
    <p style="font-size: 13px; color: #94a3b8;">This link will expire in 24 hours. If the button doesn't work, copy this URL:</p>
    <p style="font-size: 13px; word-break: break-all; color: #6366f1;">${verifyUrl}</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: '✉️ Verify your PM SaaS email address',
    html: baseEmailTemplate(content, 'Email Verification'),
  });
  logger.info(`Verification email sent to ${email}`);
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const resetUrl = `${CLIENT_URL}/reset-password/${token}`;
  const content = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p>⚠️ This link will expire in <strong>10 minutes</strong>.</p>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 16px;">If you didn't request a password reset, please ignore this email. Your password won't change.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: '🔐 Reset your PM SaaS password',
    html: baseEmailTemplate(content, 'Password Reset'),
  });
  logger.info(`Password reset email sent to ${email}`);
};

export const sendProjectInvitationEmail = async (
  email: string,
  inviterName: string,
  projectName: string,
  inviteUrl: string
): Promise<void> => {
  const content = `
    <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on PM SaaS.</p>
    <p>Click the button below to accept the invitation and start collaborating:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    </div>
    <div class="divider"></div>
    <p style="font-size: 13px; color: #94a3b8;">This invitation link expires in 7 days.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `🎯 You're invited to join "${projectName}" on PM SaaS`,
    html: baseEmailTemplate(content, 'Project Invitation'),
  });
};

export const sendTaskAssignedEmail = async (
  email: string,
  assigneeName: string,
  taskTitle: string,
  projectName: string,
  assignerName: string,
  taskUrl: string
): Promise<void> => {
  const content = `
    <p>Hi <strong>${assigneeName}</strong>,</p>
    <p><strong>${assignerName}</strong> assigned you a new task in <strong>${projectName}</strong>:</p>
    <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
      <strong style="color: #1e293b; font-size: 16px;">${taskTitle}</strong>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${taskUrl}" class="btn">View Task</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `📋 New task assigned: "${taskTitle}"`,
    html: baseEmailTemplate(content, 'Task Assigned'),
  });
};
