const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../lib/supabase');
const { generateOTP, sendOTPEmail, sendWelcomeEmail, initializeTransporter } = require('../services/mail.service');

// Initialize mail transporter on startup
initializeTransporter();

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

/**
 * Generate and store OTP for email
 * OTP expires in 10 minutes
 */
function storeOTP(email, otp, fullName, mobileNo) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email, { otp, expiresAt, fullName, mobileNo });
  
  // Auto-delete expired OTP
  setTimeout(() => {
    otpStore.delete(email);
  }, 10 * 60 * 1000);
  
  return { otp, expiresAt };
}

/**
 * Verify OTP for email
 */
function verifyOTP(email, otp) {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { valid: false, error: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, error: 'OTP expired' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, error: 'Invalid OTP' };
  }
  
  return { valid: true, data: stored };
}

/**
 * @route POST /api/auth/send-otp
 * @desc Send OTP to email for registration/login
 * @access Public
 */
router.post(
  '/send-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('full_name').notEmpty().trim().optional(),
    body('mobile_no').optional().trim(),  // Accept any mobile format
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, full_name, mobile_no } = req.body;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('citizens')
        .select('id')
        .eq('email', email)
        .single();

      // For registration: email should not exist
      if (full_name && existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered. Please login instead.',
        });
      }

      // For login: email should exist
      if (!full_name && !existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email not found. Please register first.',
        });
      }

      // Generate OTP
      const otp = generateOTP();

      try {
        // Send OTP email
        await sendOTPEmail(email, otp, full_name || 'User');

        // Store OTP
        storeOTP(email, otp, full_name, mobile_no);

        return res.json({
          success: true,
          message: 'OTP sent successfully to your email',
          data: { email },
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        return res.status(500).json({
          success: false,
          error: 'Failed to send OTP email. Please try again later.',
          details: emailError.message,
        });
      }
    } catch (error) {
      console.error('Error in send-otp:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and create citizen account (registration)
 * @access Public
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').notEmpty().trim(),
    body('mobile_no').notEmpty().trim(),  // Accept any mobile format
    body('city_id').optional().isUUID(),
    body('state_id').optional().isUUID(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors in verify-otp:', errors.array());
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, otp, password, full_name, mobile_no, city_id, state_id } = req.body;
      console.log('verify-otp request:', { email, otp: '****', full_name, mobile_no, city_id, state_id });

      // Verify OTP
      const otpResult = verifyOTP(email, otp);
      if (!otpResult.valid) {
        console.error('OTP verification failed:', otpResult.error);
        return res.status(400).json({
          success: false,
          error: otpResult.error,
        });
      }

      console.log('OTP verified successfully');

      // Check if user already exists in citizens table (profile already created)
      const { data: existingProfile } = await supabase
        .from('citizens')
        .select('id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        console.error('User already registered with this email');
        return res.status(400).json({
          success: false,
          error: 'Email already registered. Please login instead.',
        });
      }

      // Check if auth user already exists (orphaned auth user from failed registration)
      let authData = null;
      let existingAuthUser = null;
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && userList.users) {
        existingAuthUser = userList.users.find(u => u.email === email);
      }

      if (existingAuthUser) {
        console.log('Using existing auth user:', existingAuthUser.id);
        authData = { user: existingAuthUser };
      } else {
        // Create new Supabase auth user
        const { data: newAuthData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Mark email as confirmed since OTP was verified
        });

        if (authError) {
          console.error('Auth user creation error:', authError);
          return res.status(400).json({
            success: false,
            error: 'Failed to create auth user: ' + authError.message,
          });
        }

        authData = newAuthData;
        console.log('Auth user created:', authData.user.id);
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('citizens')
        .insert({
          id: authData.user.id,
          full_name,
          phone: mobile_no,
          email: email,
          city_id: city_id || null,
          state_id: state_id || null,
        })
        .select()
        .single();

      if (profileError) {
        // Clean up - delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error('Profile creation error:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        });
        return res.status(400).json({
          success: false,
          error: 'Failed to create profile: ' + profileError.message,
          code: profileError.code,
          details: profileError.details,
        });
      }

      console.log('Profile created successfully:', profile.id);

      // Clear OTP from store
      otpStore.delete(email);

      // Send welcome email
      try {
        await sendWelcomeEmail(email, full_name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the registration if welcome email fails
      }

      res.json({
        success: true,
        message: 'Account created successfully',
        data: { user: authData.user, profile },
      });
    } catch (error) {
      console.error('Error in verify-otp:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/auth/citizen/login
 * @desc Login for citizens (password-based)
 * @access Public
 */
router.post(
  '/citizen/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('citizens')
        .select('*, states(name, code), cities(name)')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to load profile',
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: { user: data.user, profile, session: data.session },
      });
    } catch (error) {
      console.error('Error in citizen login:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/auth/admin/login
 * @desc Login for admin/officer (password-based)
 * @access Public
 */
router.post(
  '/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('officers')
        .select('*, states(name, code), cities(name), departments(name)')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to load profile',
        });
      }

      // Verify this is an admin/officer account
      if (!['dept_officer', 'mc_admin', 'state_admin'].includes(profile.role)) {
        return res.status(400).json({
          success: false,
          error: `Invalid account type: ${profile.role}`,
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: { user: data.user, profile, session: data.session },
      });
    } catch (error) {
      console.error('Error in admin login:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route POST /api/auth/admin/create
 * @desc Create a new admin or department officer account (Admin only)
 * @access Private - Requires admin authorization
 */
router.post(
  '/admin/create',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').notEmpty().trim(),
    body('role').isIn(['dept_officer', 'mc_admin', 'state_admin']).withMessage('Invalid role'),
    body('department_id').optional().isUUID(),
    body('city_id').optional().isUUID(),
    body('state_id').optional().isUUID(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, full_name, role, department_id, city_id, state_id } = req.body;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          error: authError.message,
        });
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('officers')
        .insert({
          id: authData.user.id,
          full_name,
          phone: null,
          email: email,
          role,
          department_id: role === 'dept_officer' ? department_id : null,
          city_id: city_id || null,
          state_id: state_id || null,
        })
        .select()
        .single();

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({
          success: false,
          error: 'Failed to create profile: ' + profileError.message,
        });
      }

      res.json({
        success: true,
        message: 'Admin/Officer account created successfully',
        data: { user: authData.user, profile },
      });
    } catch (error) {
      console.error('Error creating admin account:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/auth/admin/users
 * @desc Get all admin and officer accounts (Admin only)
 * @access Private
 */
router.get('/admin/users', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('officers')
      .select('id, full_name, phone, email, role, city_id, department_id, created_at')
      .in('role', ['dept_officer', 'mc_admin', 'state_admin']);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * @route DELETE /api/auth/admin/users/:userId
 * @desc Delete an admin or officer account (Admin only)
 * @access Private
 */
router.delete('/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return res.status(400).json({
        success: false,
        error: deleteAuthError.message,
      });
    }

    res.json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * @route POST /api/auth/admin/update-password
 * @desc Update an admin/officer password (Admin only)
 * @access Private
 */
router.post(
  '/admin/update-password',
  [
    body('userId').isUUID(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId, newPassword } = req.body;

      const { user, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: 'Password updated successfully',
        data: { user },
      });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile (Protected)
 * @access Private
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // First check citizen table
    let { data: profile, error } = await supabase
      .from('citizens')
      .select('*, states(name, code), cities(name)')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      // If not a citizen, check officer table
      const { data: officerProfile, error: officerError } = await supabase
        .from('officers')
        .select('*, states(name, code), cities(name), departments(name)')
        .eq('id', userId)
        .maybeSingle();
        
      if (officerProfile) {
        profile = officerProfile;
      } else {
        error = officerError || error;
      }
    }

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

module.exports = router;
