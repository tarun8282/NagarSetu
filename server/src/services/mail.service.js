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

/**
 * Send complaint submission confirmation email to citizen
 */
async function sendComplaintConfirmationEmail(email, fullName, complaint) {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'noreply@nagarsetu.com',
    to: email,
    subject: `NagarSetu - Complaint Registered: ${complaint.complaint_number}`,
    html: getComplaintConfirmationTemplate(fullName, complaint),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mail Service] Complaint confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mail Service] Error sending complaint confirmation email:', error);
    // Non-fatal — don't throw, just warn
    return { success: false, error: error.message };
  }
}

function getComplaintConfirmationTemplate(fullName, complaint) {
  const priorityColors = {
    low: '#138808',
    medium: '#f59e0b',
    high: '#FF9933',
    critical: '#dc2626',
  };
  const priColor = priorityColors[complaint.priority] || '#FF9933';
  const trackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/complaint/${complaint.id}`;
  const slaDue = complaint.sla_deadline
    ? new Date(complaint.sla_deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
    : 'N/A';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #FF9933 0%, #e67300 100%); color: white; padding: 36px 32px; }
        .header h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; opacity: 0.85; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-top: 12px; text-transform: uppercase; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .sub { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; width: 120px; flex-shrink: 0; padding-top: 2px; }
        .info-value { font-size: 14px; font-weight: 600; color: #1e293b; text-align: right; flex: 1; }
        .priority-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: white; background-color: ${priColor}; }
        .description-box { background: #fffbeb; border-left: 4px solid #FF9933; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 14px; color: #44403c; line-height: 1.7; }
        .cta-button { display: block; background: linear-gradient(135deg, #FF9933, #e67300); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; text-align: center; margin-bottom: 24px; }
        .note { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #166534; line-height: 1.6; margin-bottom: 20px; }
        .footer { background-color: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e5e7eb; }
        .footer a { color: #FF9933; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏙️ NagarSetu</h1>
          <p>Your complaint has been successfully registered</p>
          <div class="badge">✓ Complaint Accepted</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName},</div>
          <div class="sub">We've received your complaint and our AI system has validated and classified it. Your case is now assigned and being reviewed by the relevant department.</div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Complaint No.</div>
              <div class="info-value" style="font-family: monospace; color: #FF9933; font-size: 15px;">${complaint.complaint_number}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Title</div>
              <div class="info-value">${complaint.title}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Category</div>
              <div class="info-value">${(complaint.category || 'General').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Priority</div>
              <div class="info-value"><span class="priority-badge">${complaint.priority || 'medium'}</span></div>
            </div>
            <div class="info-row">
              <div class="info-label">Assigned To</div>
              <div class="info-value">${complaint.department_name || 'Department'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">SLA Deadline</div>
              <div class="info-value">${slaDue}</div>
            </div>
            ${complaint.address ? `<div class="info-row">
              <div class="info-label">Address</div>
              <div class="info-value" style="font-size: 13px;">${complaint.address}</div>
            </div>` : ''}
          </div>

          ${complaint.description ? `<div class="description-box">
            <strong style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#d97706; margin-bottom:6px;">Your Description</strong>
            ${complaint.description}
          </div>` : ''}

          <a href="${trackUrl}" class="cta-button">🔍 Track My Complaint</a>

          <div class="note">
            ✅ <strong>What happens next?</strong><br>
            A department officer will review your complaint and take action within the SLA deadline. You will receive updates on your registered email as the status changes.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;">© 2026 NagarSetu Initiative. A Vision for a Clean, Digitally Connected India.</p>
          <p style="margin: 0;"><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send status update notification email to citizen
 */
async function sendStatusUpdateEmail(email, fullName, complaint) {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'noreply@nagarsetu.com',
    to: email,
    subject: `NagarSetu - Update on ${complaint.complaint_number}: Status Changed to ${complaint.new_status.replace(/_/g, ' ').toUpperCase()}`,
    html: getStatusUpdateTemplate(fullName, complaint),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mail Service] Status update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mail Service] Error sending status update email:', error);
    return { success: false, error: error.message };
  }
}

function getStatusUpdateTemplate(fullName, complaint) {
  const statusConfig = {
    submitted:    { label: 'Submitted',    color: '#f59e0b', icon: '📋', bg: '#fffbeb' },
    ai_processing:{ label: 'AI Processing',color: '#8b5cf6', icon: '🤖', bg: '#f5f3ff' },
    under_review: { label: 'Under Review', color: '#3b82f6', icon: '🔍', bg: '#eff6ff' },
    in_progress:  { label: 'In Progress',  color: '#FF9933', icon: '⚙️', bg: '#fff7ed' },
    resolved:     { label: 'Resolved',     color: '#138808', icon: '✅', bg: '#f0fdf4' },
    rejected:     { label: 'Rejected',     color: '#ef4444', icon: '❌', bg: '#fef2f2' },
    escalated:    { label: 'Escalated',    color: '#dc2626', icon: '🚨', bg: '#fef2f2' },
  };

  const newMeta  = statusConfig[complaint.new_status]  || { label: complaint.new_status,  color: '#64748b', icon: '📌', bg: '#f8fafc' };
  const oldMeta  = statusConfig[complaint.old_status]  || { label: complaint.old_status,  color: '#64748b', icon: '📌', bg: '#f8fafc' };
  const trackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/complaint/${complaint.id}`;
  const isResolved = complaint.new_status === 'resolved';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, ${newMeta.color} 0%, ${newMeta.color}cc 100%); color: white; padding: 36px 32px; }
        .header h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .sub { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
        .status-flow { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 20px; }
        .status-pill { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .arrow { font-size: 20px; color: #94a3b8; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; width: 120px; flex-shrink: 0; padding-top: 2px; }
        .info-value { font-size: 14px; font-weight: 600; color: #1e293b; text-align: right; flex: 1; }
        .remarks-box { background: ${newMeta.bg}; border-left: 4px solid ${newMeta.color}; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 14px; color: #1e293b; line-height: 1.7; }
        .cta-button { display: block; background: linear-gradient(135deg, #FF9933, #e67300); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; text-align: center; margin-bottom: 24px; }
        .resolved-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; font-size: 14px; color: #166534; line-height: 1.7; margin-bottom: 20px; }
        .footer { background-color: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e5e7eb; }
        .footer a { color: #FF9933; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${newMeta.icon} Status Update</h1>
          <p>Your complaint ${complaint.complaint_number} has a new update</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName},</div>
          <div class="sub">There has been an update to your complaint. Here are the latest details:</div>

          <div class="status-flow">
            <span class="status-pill" style="color:${oldMeta.color}; background:${oldMeta.bg}; border: 1.5px solid ${oldMeta.color}33;">${oldMeta.icon} ${oldMeta.label}</span>
            <span class="arrow">→</span>
            <span class="status-pill" style="color:white; background:${newMeta.color};">${newMeta.icon} ${newMeta.label}</span>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Complaint No.</div>
              <div class="info-value" style="font-family: monospace; color: #FF9933;">${complaint.complaint_number}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Title</div>
              <div class="info-value">${complaint.title}</div>
            </div>
            <div class="info-row">
              <div class="info-label">New Status</div>
              <div class="info-value"><span style="color:${newMeta.color}; font-weight:800;">${newMeta.label}</span></div>
            </div>
            ${complaint.updated_at ? `<div class="info-row">
              <div class="info-label">Updated At</div>
              <div class="info-value">${new Date(complaint.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</div>
            </div>` : ''}
          </div>

          ${complaint.remarks ? `<div class="remarks-box">
            <strong style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${newMeta.color}; margin-bottom:6px;">Officer Remarks</strong>
            ${complaint.remarks}
          </div>` : ''}

          ${isResolved ? `<div class="resolved-box">
            🎉 <strong>Your complaint has been resolved!</strong><br>
            We hope the issue has been addressed to your satisfaction. You can now rate the resolution directly from your complaint detail page. Thank you for using NagarSetu!
          </div>` : ''}

          <a href="${trackUrl}" class="cta-button">🔍 View Complaint Details</a>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;">© 2026 NagarSetu Initiative. A Vision for a Clean, Digitally Connected India.</p>
          <p style="margin: 0;"><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Contact Support</a></p>
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
  sendComplaintConfirmationEmail,
  sendStatusUpdateEmail,
};
