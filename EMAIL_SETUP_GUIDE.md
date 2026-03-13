# Email Configuration Guide for NagarSetu

This guide helps you configure email sending for OTP delivery using Nodemailer.

## Supported Email Providers

### Option 1: Gmail (Recommended for Quick Setup)

**Prerequisites:**
1. Gmail account
2. Enable 2-factor authentication
3. Generate App Password

**Setup Steps:**

1. Enable 2FA on your Google Account:
   - Go to https://myaccount.google.com/security
   - Navigate to "2-Step Verification"
   - Complete setup if not already done

2. Create App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google generates a 16-character password

3. Add to `.env`:
```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=noreply@nagarsetu.com
CLIENT_URL=http://localhost:5173
```

**Example:**
```env
EMAIL_PROVIDER=gmail
GMAIL_USER=admin@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM=NagarSetu <noreply@nagarsetu.com>
CLIENT_URL=http://localhost:5173
```

---

### Option 2: Outlook / Office 365

**Setup Steps:**

1. Use your Outlook email and password

2. Add to `.env`:
```env
EMAIL_PROVIDER=outlook
OUTLOOK_EMAIL=your-email@outlook.com
OUTLOOK_PASSWORD=your-password
MAIL_FROM=noreply@nagarsetu.com
CLIENT_URL=http://localhost:5173
```

---

### Option 3: Custom SMTP Server

**Setup Steps:**

1. Get SMTP details from your email provider (e.g., SendGrid, AWS SES, Mailgun)

2. Add to `.env`:
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
MAIL_FROM=noreply@nagarsetu.com
CLIENT_URL=http://localhost:5173
```

**Common SMTP Servers:**

- **SendGrid**: smtp.sendgrid.net (port 587)
- **AWS SES**: email-smtp.region.amazonaws.com (port 587)
- **Mailgun**: smtp.mailgun.org (port 587)
- **Gmail**: smtp.gmail.com (port 587, requires app password)

---

### Option 4: Ethereal (Testing Only)

For development/testing without a real email provider:

```env
EMAIL_PROVIDER=ethereal
CLIENT_URL=http://localhost:5173
```

**Note:** Ethereal creates temporary test accounts. Email preview links are logged to console.

---

## Environment Variables Template

Copy this to your `server/.env`:

```env
# ============================================
# Email Configuration
# ============================================

# Provider: gmail, outlook, custom, ethereal
EMAIL_PROVIDER=gmail

# Gmail Configuration (if using provider=gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Outlook Configuration (if using provider=outlook)
# OUTLOOK_EMAIL=your-email@outlook.com
# OUTLOOK_PASSWORD=your-app-password

# Custom SMTP Configuration (if using provider=custom)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=username
# SMTP_PASSWORD=password

# General Email Settings
MAIL_FROM=NagarSetu <noreply@nagarsetu.com>
CLIENT_URL=http://localhost:5173

# ============================================
# Supabase Configuration
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# Server Configuration
# ============================================
PORT=3001
NODE_ENV=development
```

---

## Testing Email Configuration

### Method 1: Using the CLI

Create a test script `test-email.js`:

```javascript
require('dotenv').config();
const { sendOTPEmail, initializeTransporter, generateOTP } = require('./src/services/mail.service');

async function testEmail() {
  initializeTransporter();
  
  const testEmail = 'test@example.com';
  const testOTP = generateOTP();
  
  try {
    console.log('Sending test OTP email...');
    const result = await sendOTPEmail(testEmail, testOTP, 'Test User');
    console.log('Success! Message ID:', result.messageId);
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

testEmail();
```

Run it:
```bash
node test-email.js
```

### Method 2: Using Postman

1. Send POST request to `http://localhost:3001/api/auth/send-otp`
2. Body:
```json
{
  "email": "test@example.com",
  "full_name": "Test User",
  "mobile_no": "9876543210"
}
```

---

## Email Templates

The mail service includes beautiful HTML email templates for:

1. **OTP Email** - For registration and login
   - Displays 6-digit OTP
   - Shows expiration time (10 minutes)
   - Security warning

2. **Welcome Email** - After successful registration
   - Personalized greeting
   - Features list
   - Dashboard link

3. **Password Reset Email** - For password recovery
   - Reset link with token
   - Expiration notice (1 hour)
   - Security warning

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Files should only be in `server/.env`, not `.env.local`

### "Failed to send OTP email"
- Verify EMAIL_PROVIDER is set correctly
- Check email credentials are accurate
- For Gmail: Ensure App Password is used (not regular password)
- For Gmail: Check 2FA is enabled
- Check MAIL_FROM format: `name@example.com` or `Display Name <name@example.com>`

### "Cannot connect to SMTP server"
- Verify SMTP_HOST and SMTP_PORT are correct
- Check SMTP_SECURE setting (use `true` for port 465, `false` for 587)
- Verify username and password
- Check firewall isn't blocking SMTP port

### "Invalid credentials"
- For Gmail: You need App Password, not account password
- For 2FA protected accounts: Use app-specific passwords
- Check for spaces or extra characters in password

### Ethereal emails showing preview links
- Check server console for "Preview URL"
- Open the link in browser to see test email
- **Note:** Ethereal is for testing only, not production

### "Emails going to spam"
In production, add SPF, DKIM, and DMARC records:
- Contact your email provider for setup instructions
- Verify MAIL_FROM domain matches your sending domain
- Test with tools like MXToolbox

---

## Production Recommendations

1. **Use dedicated email service**:
   - SendGrid (free tier: 100 emails/day)
   - AWS SES (very cheap at scale)
   - Mailgun (free tier: 5,000 emails/month)

2. **Security**:
   - Store credentials in environment variables
   - Never commit `.env` to version control
   - Use app-specific passwords, not account passwords
   - Rotate credentials periodically

3. **Performance**:
   - Consider queue-based email delivery for high volume
   - Implement rate limiting for OTP requests
   - Add retry logic for failed sends

4. **Monitoring**:
   - Log all email sends
   - Track bounce rates
   - Monitor SMTP connection errors
   - Set up alerts for failures

---

## Support

For issues with specific providers:

- **Gmail**: https://support.google.com/accounts/answer/185833
- **Outlook**: https://support.microsoft.com/account-billing
- **Nodemailer**: https://nodemailer.com/
- **SendGrid**: https://sendgrid.com/docs
- **AWS SES**: https://docs.aws.amazon.com/ses/

---

Last Updated: March 13, 2026
