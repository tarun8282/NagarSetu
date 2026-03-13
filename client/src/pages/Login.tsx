import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';

type LoginMode = 'citizen' | 'admin';
type LoginStep = 'email' | 'otp' | 'password';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { sendLoginOTP, citizenLoginWithOTP, adminLogin } = useAuth();

  const [mode, setMode] = useState<LoginMode>('citizen');
  const [step, setStep] = useState<LoginStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Citizen login state
  const [citizenEmail, setCitizenEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // ==================== CITIZEN LOGIN ====================

  const handleCitizenEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitizenEmail(e.target.value);
  };

  const handleSendCitizenOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!citizenEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await sendLoginOTP(citizenEmail);

      if (response.success) {
        setSuccessMessage('OTP sent to your email');
        setStep('otp');
        setError('');
      } else {
        setError(response.error || response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyCitizenOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpToken = otp.join('');
    if (otpToken.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await citizenLoginWithOTP(citizenEmail, otpToken);

      if (response.success) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(response.error || response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await sendLoginOTP(citizenEmail);

      if (response.success) {
        setSuccessMessage('OTP sent again. Check your email!');
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(response.error || response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADMIN LOGIN ====================

  const handleAdminEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminEmail(e.target.value);
  };

  const handleAdminPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPassword(e.target.value);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminEmail || !adminPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await adminLogin(adminEmail, adminPassword);

      if (response.success) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setError(response.error || response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-12">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400">Log in to track your complaints</p>
        </div>

        {/* Login Mode Selector */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('citizen');
              setStep('email');
              setError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'citizen'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Admin/Officer
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-400 text-sm flex gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ==================== CITIZEN LOGIN ==================== */}
        {mode === 'citizen' && (
          <>
            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendCitizenOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={citizenEmail}
                    onChange={handleCitizenEmailChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !citizenEmail}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyCitizenOTP} className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    OTP has been sent to your email
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white break-all">{citizenEmail}</p>
                </div>

                {/* OTP Input Fields */}
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value.slice(-1))}
                      maxLength={1}
                      className="w-12 h-12 text-center text-2xl rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                      inputMode="numeric"
                    />
                  ))}
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    Didn't receive OTP? Resend
                  </button>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {loading ? 'Verifying...' : 'Login'}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="w-full py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
              </form>
            )}

            {/* Signup Link */}
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Sign up here
              </button>
            </div>
          </>
        )}

        {/* ==================== ADMIN LOGIN ==================== */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-400 text-sm">
              Admin and Officer accounts are created by administrators. Contact your system administrator to set up your account.
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={handleAdminEmailChange}
                placeholder="admin@nagarsetu.com"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={handleAdminPasswordChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !adminEmail || !adminPassword}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;