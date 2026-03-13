import { supabase } from '../lib/supabase';

export interface SignUpData {
  email: string;
  fullName: string;
  mobileNo: string;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// ==========================================
// CITIZEN AUTHENTICATION (OTP-based via Email)
// ==========================================

/**
 * Send OTP to citizen's email for registration
 * @param email - User's email address
 * @param fullName - User's full name
 * @param mobileNo - User's mobile number
 */
export const sendRegistrationOTP = async (
  email: string,
  fullName: string,
  mobileNo: string
): Promise<SignUpResponse> => {
  try {
    if (!email || !fullName || !mobileNo) {
      return {
        success: false,
        message: 'Missing required fields',
        error: 'Email, full name, and mobile number are required'
      };
    }

    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
        mobile_no: mobileNo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to send OTP',
        error: data.error || 'Unknown error'
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error sending OTP',
      error: error.message
    };
  }
};

/**
 * Send OTP for login
 */
export const sendLoginOTP = async (email: string): Promise<SignUpResponse> => {
  try {
    if (!email) {
      return {
        success: false,
        message: 'Email is required',
        error: 'Please provide your email address'
      };
    }

    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to send OTP',
        error: data.error || 'Unknown error'
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error sending OTP',
      error: error.message
    };
  }
};

/**
 * Verify OTP and create citizen account
 */
export const verifyOTPAndSignUp = async (
  email: string,
  fullName: string,
  mobileNo: string,
  otp: string,
  password?: string,
  cityId?: string,
  stateId?: string
): Promise<SignUpResponse> => {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
        mobile_no: mobileNo,
        otp,
        password,
        city_id: cityId,
        state_id: stateId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Verification failed',
        error: data.error || 'Invalid OTP'
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    };
  }
};

/**
 * Citizen login with password
 */
export const citizenLogin = async (
  email: string,
  password: string
): Promise<SignUpResponse> => {
  try {
    const response = await fetch('/api/auth/citizen/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
        error: data.error || 'Invalid credentials'
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error during login',
      error: error.message
    };
  }
};

// ==========================================
// ADMIN & DEPARTMENT OFFICER LOGIN (Password-based)
// ==========================================

/**
 * Admin/Officer login with email and password
 */
export const adminLogin = async (
  email: string,
  password: string
): Promise<SignUpResponse> => {
  try {
    const response = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
        error: data.error || 'Invalid credentials'
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error during login',
      error: error.message
    };
  }
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = async (): Promise<SignUpResponse> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        message: 'Error logging out',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error logging out',
      error: error.message
    };
  }
};

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    return { session, error: null };
  } catch (error: any) {
    return { session: null, error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
};
