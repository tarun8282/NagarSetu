const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service using Nodemailer
 * Supports multiple email providers:
 * - Gmail (with App Passwords)
 * - Outlook/Office 365
 * - Custom SMTP
 * - Ethereal (testing)
 */

let transporter;

/**
 * Initialize email transporter
 * Configure based on EMAIL_PROVIDER env variable
 */
function initializeTransporter() {
  const provider = process.env.EMAIL_PROVIDER || 'gmail';

  console.log(`[Mail Service] Initializing ${provider} email transporter...`);

  switch (provider) {
    case 'gmail':
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER?.trim(),
          pass: process.env.GMAIL_APP_PASSWORD?.trim().replace(/\s+/g, ''),
        },
      });
      break;

    case 'outlook':
      transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: process.env.OUTLOOK_EMAIL,
          pass: process.env.OUTLOOK_PASSWORD,
        },
      });
      break;

    case 'custom':
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      break;

    case 'ethereal':
      // For testing only - creates a fake Ethereal email account
      nodemailer.createTestAccount().then((testAccount) => {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[Mail Service] Ethereal test account: ${testAccount.user}`);
      });
      break;

    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }

  // Verify transporter (non-blocking — SMTP may be unavailable on dev networks)
  transporter.verify((error) => {
    if (error) {
      console.warn(`[Mail Service] ⚠️  SMTP not reachable (${error.code || error.message}) — emails will fail until fixed. Server continues normally.`);
    } else {
      console.log('[Mail Service] ✅ Ready to send emails');
    }
  });
}

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email to user
 */
async function sendOTPEmail(email, otp, fullName) {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'noreply@nagarsetu.com',
    to: email,
    subject: 'NagarSetu - Your OTP for Email Verification',
    html: getOTPEmailTemplate(fullName, otp),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mail Service] OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mail Service] Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

/**
 * Send welcome email after successful registration
 */
async function sendWelcomeEmail(email, fullName) {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'noreply@nagarsetu.com',
    to: email,
    subject: 'Welcome to NagarSetu!',
    html: getWelcomeEmailTemplate(fullName),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mail Service] Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mail Service] Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetToken) {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'noreply@nagarsetu.com',
    to: email,
    subject: 'NagarSetu - Reset Your Password',
    html: getPasswordResetEmailTemplate(resetLink),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mail Service] Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mail Service] Error sending reset email:', error);
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
}

/**
 * Email Templates
 */

function getOTPEmailTemplate(fullName, otp) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 20px;
          text-align: center;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .otp-box {
          background-color: #f0f9ff;
          border: 2px solid #2563eb;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .otp-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 700;
          color: #2563eb;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .expiry {
          font-size: 12px;
          color: #dc2626;
          margin-top: 15px;
        }
        .warning {
          background-color: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
          color: #991b1b;
          text-align: left;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e5e7eb;
        }
        .footer a {
          color: #2563eb;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏙️ NagarSetu</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Email Verification</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName},</div>
          <div class="message">
            Thank you for signing up with NagarSetu. To complete your registration, please verify your email address using the OTP below.
          </div>
          <div class="otp-box">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry">⏱️ This code expires in 10 minutes</div>
          </div>
          <div class="warning">
            <strong>⚠️ Important:</strong> Never share this code with anyone. NagarSetu staff will never ask for your OTP.
          </div>
          <div class="message" style="margin-top: 30px;">
            If you didn't sign up for this account, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0; margin-bottom: 10px;">© 2026 NagarSetu. All rights reserved.</p>
          <p style="margin: 0;">
            <a href="#">Privacy Policy</a> | 
            <a href="#">Terms of Service</a> | 
            <a href="#">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getWelcomeEmailTemplate(fullName) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 20px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .feature-list {
          list-style: none;
          padding: 0;
          margin: 30px 0;
        }
        .feature-list li {
          padding: 12px 0;
          padding-left: 30px;
          position: relative;
          color: #666;
          font-size: 14px;
        }
        .feature-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
          font-size: 18px;
        }
        .cta-button {
          display: inline-block;
          background-color: #10b981;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 30px 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to NagarSetu!</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName},</div>
          <div class="message">
            Your account has been successfully created and verified. You're now ready to start reporting and tracking civic complaints on NagarSetu.
          </div>
          <div class="message">
            <strong>What you can do:</strong>
          </div>
          <ul class="feature-list">
            <li>Report civic complaints with photos and location</li>
            <li>Track complaint status in real-time</li>
            <li>Receive updates on complaint resolution</li>
            <li>Rate and provide feedback on resolved complaints</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://nagarsetu.com'}/dashboard" class="cta-button">
              Go to Dashboard
            </a>
          </div>
          <div class="message" style="margin-top: 30px;">
            If you have any questions or need help, feel free to contact our support team.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0; margin-bottom: 10px;">© 2026 NagarSetu. All rights reserved.</p>
          <p style="margin: 0;">
            <a href="#">Privacy Policy</a> | 
            <a href="#">Terms of Service</a> | 
            <a href="#">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getPasswordResetEmailTemplate(resetLink) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 20px;
        }
        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-block;
          background-color: #f59e0b;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 30px auto;
          text-align: center;
        }
        .warning {
          background-color: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
          color: #991b1b;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <div class="message">
            You requested to reset your password. Click the button below to create a new password.
          </div>
          <div style="text-align: center;">
            <a href="${resetLink}" class="cta-button" style="display: inline-block;">
              Reset Password
            </a>
          </div>
          <div class="message">
            Or copy this link: <br>
            <code style="background: #f3f4f6; padding: 10px; border-radius: 4px; display: block; word-break: break-all; margin-top: 10px;">
              ${resetLink}
            </code>
          </div>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request this, ignore this email and your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0; margin-bottom: 10px;">© 2026 NagarSetu. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  initializeTransporter,
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
