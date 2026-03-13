# NagarSetu Authentication Setup Guide

## Overview

This guide explains how to set up and use the Supabase authentication system for NagarSetu with three user roles:
- **Citizens**: OTP-based signup and login via email with Nodemailer
- **Department Officers**: Password-based login (admin-created)
- **Admins**: Password-based login (admin-created)

---

## Prerequisites

1. **Supabase Project** - Create one at [supabase.com](https://supabase.com)
2. **Email Service Account** - Gmail, Outlook, or custom SMTP
3. **Environment Variables** - Set up `.env.local` and `.env` files
4. **Database Schema** - Already initialized in `supabase/schema.sql`

---

## Step 1: Supabase Project Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Save your credentials:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key** (public key for client)
   - **Service Role Key** (private key for server - keep secret!)

### Initialize Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query and run the contents of `supabase/schema.sql`
3. Run the migration from `supabase/migrations/add_email_to_profiles.sql` to add email column
4. Run the seed data from `supabase/seed.sql` (optional, for test data)

---

## Step 2: Environment Variables

### Client Setup (`.env.local` in `client/`)

Create a file: `client/.env.local`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Server Setup (`.env` in `server/`)

Create a file: `server/.env`

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Email Configuration (Gmail example)
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=NagarSetu <noreply@nagarsetu.com>

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**⚠️ Important**: Add `.env` to `.gitignore` to prevent exposing secrets!

---

## Step 3: Set Up Email Service

### Quick Setup with Gmail (Recommended)

1. **Enable 2-Factor Authentication**:
   - Go to https://myaccount.google.com/security
   - Set up 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password

3. **Add to `.env`**:
```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Alternative: Outlook, Custom SMTP, or Ethereal

See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) for detailed instructions for other email providers.

---

## Step 4: Install Dependencies

### Client

```bash
cd client
npm install
```

### Server

```bash
cd server
npm install
npm install nodemailer
```

---

## Step 5: Run the Application

### Development Mode

#### Terminal 1 - Start Server

```bash
cd server
npm run dev
```

Server runs on `http://localhost:3001`

#### Terminal 2 - Start Client

```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173`

---

## Authentication Flow

### Citizen Registration (Email OTP)

```
1. User clicks "Register"
2. Enter full name, email, mobile number
3. Click "Send OTP to Email"
4. System sends 6-digit OTP to email
5. User enters OTP in app
6. System creates:
   - Auth user in Supabase Auth
   - Profile in profiles table with role='citizen'
7. User is automatically logged in
8. Welcome email is sent
```

### Citizen Login (Email OTP)

```
1. User clicks "Login" → Select "Citizen"
2. Enter email address
3. Click "Send OTP"
4. System sends 6-digit OTP to email
5. User enters OTP
6. User is logged in and redirected to dashboard
```

### Admin/Officer Login (Password)

```
1. User clicks "Login" → Select "Admin/Officer"
2. Enter email + password
3. System verifies credentials
4. User is logged in
   (Only if role is dept_officer, mc_admin, or state_admin)
5. User is redirected to admin dashboard
```

---

## API Endpoints

### Client-side (in `src/api/auth.ts`)

```typescript
// Send OTP for registration
sendRegistrationOTP(email: string, fullName: string, mobileNo: string)

// Send OTP for login
sendLoginOTP(email: string)

// Verify OTP and create citizen account
verifyOTPAndSignUp(email, fullName, mobileNo, otp, cityId?, stateId?)

// Verify OTP and login citizen
citizenLoginWithOTP(email, otp)

// Admin/Officer login - password
adminLogin(email, password)

// Logout
logout()
```

### Server-side (in `src/routes/auth.js`)

```
POST /api/auth/send-otp
  - Send OTP to email for registration or login
  - Body: { email, full_name?, mobile_no? }

POST /api/auth/verify-otp
  - Verify OTP and create citizen account
  - Body: { email, otp, full_name, mobile_no, city_id?, state_id? }

POST /api/auth/login-with-otp
  - Verify OTP and login citizen
  - Body: { email, otp }

POST /api/auth/admin/login
  - Login with email and password (admin/officer only)
  - Body: { email, password }

POST /api/auth/admin/create
  - Create new admin/officer account (admin-only)
  - Body: { email, password, full_name, role, department_id?, city_id?, state_id? }

GET /api/auth/admin/users
  - List all admin/officer accounts (admin-only)

DELETE /api/auth/admin/users/:userId
  - Delete an account (admin-only)

POST /api/auth/admin/update-password
  - Update account password (admin-only)
  - Body: { userId, newPassword }
```

---

## Creating Admin Accounts

### Using the Admin Manager CLI

```bash
cd server

# Create Master Admin
node src/utils/admin-manager.js create \
  admin@nagarsetu.com \
  SecurePassword123! \
  "Admin User" \
  mc_admin

# Create Department Officer
node src/utils/admin-manager.js create \
  officer@department.com \
  SecurePassword456! \
  "Officer Name" \
  dept_officer \
  <department-uuid>

# List all accounts
node src/utils/admin-manager.js list

# Delete an account
node src/utils/admin-manager.js delete <user-id>

# Reset password
node src/utils/admin-manager.js reset-password <user-id> <new-password>
```

---

## Route Protection

Protected routes in `src/App.tsx`:

```typescript
// Citizen-only routes
/dashboard                - Citizen dashboard
/complaint/new            - Create complaint
/complaint/:id            - View complaint details

// Officer-only routes
/officer/dashboard        - Department officer dashboard

// Admin-only routes
/admin/dashboard          - Admin dashboard (mc_admin, state_admin)
```

---

## User Roles and Permissions

| Role | Signup | Login | Access |
|------|--------|-------|--------|
| **citizen** | ✅ Self sign-up via OTP | ✅ Email OTP | Dashboard, Create complaints |
| **dept_officer** | ❌ Admin-created | ✅ Password | Officer dashboard, Manage complaints |
| **mc_admin** | ❌ Admin-created | ✅ Password | Admin dashboard, Manage officers |
| **state_admin** | ❌ Admin-created | ✅ Password | Admin dashboard, Manage all |

---

## Email Configuration

The system sends three types of emails:

1. **OTP Email** - 6-digit code for registration/login (expires in 10 minutes)
2. **Welcome Email** - Sent after successful registration
3. **Password Reset Email** - For admin password reset (expires in 1 hour)

All emails use beautiful HTML templates that are mobile-friendly and branded.

For detailed email setup instructions, see [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)

---

## Troubleshooting

### OTP Not Received

1. Check Supabase email settings are configured
2. Verify email provider credentials in `.env`
3. Check spam/junk folders
4. Server logs should show email sending details

### Citizen Registration Fails

1. Ensure user email is not already registered
2. Verify all three fields are filled: name, email, mobile
3. Check server `.env` has EMAIL_PROVIDER configured
4. Check server logs for OTP generation errors

### Admin Account Creation Fails

1. Verify service role key is correct
2. Check password is at least 8 characters
3. Ensure email is valid and unique
4. Verify database schema is initialized

### Login Redirects to Login Page

1. Verify user role matches required role for route
2. Check auth session is valid
3. Verify user profile exists in profiles table
4. Check browser console for auth errors

### Email Not Sending

1. Verify EMAIL_PROVIDER is set in `.env`
2. Check email credentials are correct
3. For Gmail: Use App Password, not account password
4. Check MAIL_FROM format
5. Test with simpler email provider (Gmail recommended)

### Database Connection Error

1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. Check Supabase project is active
3. Verify database schema is initialized
4. Check network connectivity to Supabase

---

## File Structure

```
client/
├── src/
│   ├── api/
│   │   └── auth.ts                 # Auth API methods
│   ├── context/
│   │   └── AuthContext.tsx         # Auth state management
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Register page
│   │   └── ...
│   └── App.tsx                     # Route definitions

server/
├── src/
│   ├── lib/
│   │   └── supabase.js             # Supabase client
│   ├── routes/
│   │   └── auth.js                 # Auth API routes
│   ├── services/
│   │   └── mail.service.js         # Email service with Nodemailer
│   ├── utils/
│   │   └── admin-manager.js        # Admin management CLI
│   └── index.js                    # Main server file
├── .env                            # Server environment variables
└── package.json                    # Dependencies including nodemailer

supabase/
├── schema.sql                      # Database schema
├── migrations/
│   └── add_email_to_profiles.sql  # Add email column
└── seed.sql                        # Test data

guides/
├── AUTH_SETUP_GUIDE.md            # This file
└── EMAIL_SETUP_GUIDE.md           # Email configuration
```

---

## Best Practices

✅ **DO:**
- Store service role key in environment variables only
- Use app-specific passwords for Gmail/Outlook
- Validate all inputs on client AND server
- Use HTTPS in production
- Implement rate limiting for OTP requests
- Keep passwords secure (8+ characters, mixed case/numbers)
- Log authentication events for security
- Use unique emails for each user

❌ **DON'T:**
- Expose service role key in client-side code
- Store passwords in plain text
- Use weak passwords for admin accounts
- Log sensitive user information (passwords, OTPs)
- Disable database constraints
- Allow OTP bruteforce attacks
- Share auth session tokens
- Cache sensitive credentials

---

## Next Steps

1. ✅ Environment variables configured
2. ✅ Email service set up (Gmail or alternative)
3. ✅ Supabase project initialized
4. ✅ Authentication pages implemented
5. ✅ Admin management tools set up

Now you can:
- Create citizen accounts via OTP signup
- Create admin/officer accounts via CLI
- Test login and registration flows
- Build dashboard features with authenticated users
- Implement complaint management system
- Add real-time updates and notifications

---

## Support & References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Nodemailer Documentation](https://nodemailer.com)
- [React Router Documentation](https://reactrouter.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

Last Updated: March 13, 2026
