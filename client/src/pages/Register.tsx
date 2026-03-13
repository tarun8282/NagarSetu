import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

type RegistrationStep = 'details' | 'otp-verification' | 'success';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { sendRegistrationOTP, verifyOTPAndSignUp } = useAuth();

  const [step, setStep] = useState<RegistrationStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Details form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');

  // Step 2: OTP verification
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileNo(e.target.value);
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!mobileNo.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await sendRegistrationOTP(email, fullName, mobileNo);

      if (response.success) {
        setSuccessMessage('OTP sent to your email. Check your inbox!');
        setStep('otp-verification');
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpToken = otp.join('');
    if (otpToken.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTPAndSignUp(email, fullName, mobileNo, otpToken);

      if (response.success) {
        setSuccessMessage('Account created successfully! Redirecting...');
        setStep('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(response.error || response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await sendRegistrationOTP(email, fullName, mobileNo);

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

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-12">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Join NagarSetu</h2>
          <p className="text-slate-500 dark:text-slate-400">Be the bridge to a better city</p>
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

        {/* Step 1: Enter Details */}
        {step === 'details' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mobile Number
              </label>
              <div className="flex">
                <span className="px-4 py-3 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  value={mobileNo}
                  onChange={handleMobileChange}
                  placeholder="Enter mobile number"
                  className="flex-1 px-4 py-3 rounded-r-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !fullName || !email || !mobileNo}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>

            {/* Login Link */}
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Login here
              </button>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp-verification' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                OTP has been sent to your email
              </p>
              <p className="font-medium text-slate-900 dark:text-white break-all">{email}</p>
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
              {loading ? 'Verifying...' : 'Create Account'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setOtp(['', '', '', '', '', '']);
              }}
              className="w-full py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Back
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Account Created!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Welcome to NagarSetu. You're all set to start reporting and tracking complaints. You'll be redirected to your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;