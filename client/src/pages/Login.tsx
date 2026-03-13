import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';

type LoginMode = 'citizen' | 'admin';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { citizenLogin, adminLogin } = useAuth();

  const [mode, setMode] = useState<LoginMode>('citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Citizen login state
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');

  // Admin login state — username-based (not email)
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // ==================== CITIZEN LOGIN ====================

  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!citizenEmail || !citizenPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await citizenLogin(citizenEmail, citizenPassword);
      if (response.success) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(response.error || response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADMIN LOGIN ====================

  const handleAdminUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminUsername(e.target.value);
  };

  const handleAdminPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPassword(e.target.value);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminUsername || !adminPassword) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await adminLogin(adminUsername, adminPassword);
      if (response.success) {
        const userRole = response.data?.profile?.role;
        const targetPath =
          userRole === 'dept_officer' ? '/officer/dashboard' : '/admin/dashboard';
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => navigate(targetPath), 1500);
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-deva">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400">Log in to track your complaints</p>
        </div>

        {/* Login Mode Selector */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => { setMode('citizen'); setError(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'citizen'
                ? 'bg-saffron text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setError(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'admin'
                ? 'bg-saffron text-white shadow-sm'
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
          <div className="p-4 bg-india-green-50 dark:bg-india-green-900/20 border border-india-green-200 dark:border-india-green-800 rounded-2xl text-india-green-700 dark:text-india-green-400 text-sm flex gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ==================== CITIZEN LOGIN ==================== */}
        {mode === 'citizen' && (
          <form onSubmit={handleCitizenLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={citizenEmail}
                onChange={(e) => setCitizenEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all shadow-sm"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={citizenPassword}
                  onChange={(e) => setCitizenPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all shadow-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !citizenEmail || !citizenPassword}
              className="w-full py-3 px-4 rounded-lg bg-saffron hover:bg-saffron-600 shadow-md shadow-saffron-200/50 dark:shadow-none disabled:bg-slate-400 disabled:shadow-none text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 font-bold transition-colors"
              >
                Sign up here
              </button>
            </div>
          </form>
        )}

        {/* ==================== ADMIN LOGIN ==================== */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-400 text-sm">
              Admin and Officer accounts are created by administrators. Contact your system administrator to set up your account.
            </div>

            {/* Username — text input, not email (admin-login branch) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={handleAdminUsernameChange}
                placeholder="admin_mumbai"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all shadow-sm"
                disabled={loading}
                autoFocus
              />
            </div>

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
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all shadow-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Saffron styling from main, disabled check fixed to adminUsername */}
            <button
              type="submit"
              disabled={loading || !adminUsername || !adminPassword}
              className="w-full py-3 px-4 rounded-lg bg-saffron hover:bg-saffron-600 shadow-md shadow-saffron-200/50 dark:shadow-none disabled:bg-slate-400 disabled:shadow-none text-white font-bold transition-all flex items-center justify-center gap-2"
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