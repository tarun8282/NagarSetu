import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Home, LayoutDashboard, Map, LogOut, Menu,
  Sun, Moon, PhoneCall, Bell, MoreVertical,
} from 'lucide-react';

const SOSButton: React.FC = () => (
  <Link
    to="/emergency"
    aria-label="Emergency SOS"
    className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs md:text-sm rounded-full shadow-lg shadow-red-400/40 transition-all duration-200"
  >
    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
    <PhoneCall size={14} className="md:-mt-0.5" strokeWidth={2.5} />
    <span className="tracking-widest hidden sm:block">SOS</span>
  </Link>
);

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.desktop-dropdown-container')) {
        setIsDesktopMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Role-aware dashboard path — shared by desktop and mobile
  const dashboardPath =
    user?.role === 'dept_officer'
      ? '/officer/dashboard'
      : user?.role === 'state_admin'
      ? '/state/dashboard'
      : user?.role === 'mc_admin'
      ? '/admin/dashboard'
      : '/dashboard';

  return (
    <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-xl md:text-2xl font-bold font-deva italic px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-saffron/50 transition-colors"
          >
            <span className="text-saffron">Nagar</span>
            <span className="text-india-green">Setu</span>
          </Link>
          <SOSButton />
        </div>

        {/* ── Desktop Menu ── */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {/* Role-aware dashboard link */}
              <Link
                to={dashboardPath}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-saffron transition-colors"
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              <Link
                to="/alerts"
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"
              >
                <Bell size={18} /> Alerts
              </Link>

              {/* Theme toggle inline when logged in — logout lives in the dropdown */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <Link
                to="/login"
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-saffron font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-saffron-600 transition-colors shadow-lg shadow-saffron-200 dark:shadow-none"
              >
                Register
              </Link>
            </div>
          )}

          {/* User Profile Dropdown — Home, Heatmap, and Logout */}
          {user ? (
            <div className="relative desktop-dropdown-container">
              <button
                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border transition-all duration-300 ${
                  isDesktopMenuOpen
                    ? 'bg-slate-100 dark:bg-slate-800 border-saffron/30 ring-4 ring-saffron/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-saffron/30 hover:shadow-sm'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron to-orange-600 flex items-center justify-center text-white font-bold text-xs border-2 border-white dark:border-slate-800 shadow-sm">
                  {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden lg:block pr-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">
                    {user.role?.replace('_', ' ') || 'Citizen'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                    {user.full_name?.split(' ')[0] || 'User'}
                  </p>
                </div>
                <MoreVertical size={16} className="text-slate-400" />
              </button>

              <div
                className={`absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 py-3 origin-top-right transform ${
                  isDesktopMenuOpen
                    ? 'opacity-100 visible translate-y-0 scale-100'
                    : 'opacity-0 invisible -translate-y-2 scale-95'
                }`}
              >
                {/* Dropdown Header */}
                <div className="px-5 py-3 mb-2 border-b border-slate-100 dark:border-slate-800/50">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {user.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      user.role === 'state_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      user.role === 'mc_admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      user.role === 'dept_officer' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-india-green-100 text-india-green-700 dark:bg-india-green-900/30 dark:text-india-green-400'
                    }`}>
                      {user.role?.replace('_', ' ') || 'Citizen'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate italic max-w-[120px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <Link
                  to="/"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-saffron transition-colors font-bold text-sm"
                >
                  <Home size={18} /> Home View
                </Link>
                <Link
                  to="/heatmap"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-saffron transition-colors font-bold text-sm"
                >
                  <Map size={18} /> Intelligence Map
                </Link>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-black text-sm text-left uppercase tracking-wider"
                  >
                    <LogOut size={18} /> Exit Application
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative desktop-dropdown-container">
              <button
                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                  isDesktopMenuOpen
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <MoreVertical size={20} />
              </button>

              <div
                className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-200 py-2 origin-top-right transform ${
                  isDesktopMenuOpen
                    ? 'opacity-100 visible scale-100'
                    : 'opacity-0 invisible scale-95'
                }`}
              >
                <Link
                  to="/"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-saffron transition-colors font-medium"
                >
                  <Home size={18} /> Home
                </Link>
                <Link
                  to="/heatmap"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-saffron transition-colors font-medium"
                >
                  <Map size={18} /> Heatmap
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile menu button ── */}
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          {user && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron to-orange-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-800">
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                    user.role === 'state_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    user.role === 'mc_admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    user.role === 'dept_officer' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-india-green-100 text-india-green-700 dark:bg-india-green-900/30 dark:text-india-green-400'
                  }`}>
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 font-bold" onClick={() => setIsMenuOpen(false)}>
            <Home size={18} /> Home View
          </Link>
          <Link to="/heatmap" className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 font-bold" onClick={() => setIsMenuOpen(false)}>
            <Map size={18} /> Intelligence Map
          </Link>

          {user && (
            <>
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutDashboard size={18} /> My Dashboard
              </Link>

              <Link
                to="/alerts"
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                <Bell size={18} /> Emergency Alerts
              </Link>

              <button
                onClick={() => { signOut(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 text-red-500 font-black uppercase tracking-wider mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50"
              >
                <LogOut size={18} /> Exit Application
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;