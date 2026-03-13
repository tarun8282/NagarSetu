import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Home, PlusCircle, LayoutDashboard, Map, LogOut, Menu, Sun, Moon, PhoneCall } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

// Reusable SOS button — navigates to the dedicated Emergency page
const SOSButton: React.FC = () => (
  <Link
    to="/emergency"
    aria-label="Emergency SOS — Open Emergency Services"
    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm rounded-full shadow-lg shadow-red-400/40 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300"
  >
    {/* Small pulsing dot — contained, won't affect surrounding layout */}
    <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
    <PhoneCall size={15} strokeWidth={2.5} />
    <span className="tracking-widest">SOS</span>
  </Link>
);

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-2xl font-bold font-deva italic">
          <span className="text-saffron">Nagar</span><span className="text-india-green">Setu</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <Link to="/" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-saffron transition-colors">
            <Home size={18} /> Home
          </Link>
          <LanguageSelector />

          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-saffron transition-colors">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link to="/complaint/new" className="px-5 py-2.5 bg-saffron text-white rounded-lg font-medium flex items-center gap-2 hover:bg-saffron-600 transition-colors shadow-lg shadow-saffron-200 dark:shadow-none">
                <PlusCircle size={18} /> Report Issue
              </Link>
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-saffron font-medium transition-colors">Login</Link>
              <Link to="/register" className="px-5 py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-saffron-600 transition-colors shadow-lg shadow-saffron-200 dark:shadow-none">Register</Link>
            </div>
          )}
          {/* SOS — always visible on desktop */}
          <SOSButton />
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu (Simplified) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(false)}><Home size={18} /> Home</Link>
          <LanguageSelector />
          {user && (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(false)}><LayoutDashboard size={18} /> Dashboard</Link>
              <Link to="/complaint/new" className="flex items-center gap-2 text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(false)}><PlusCircle size={18} /> Report Issue</Link>
              <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-red-500"><LogOut size={18} /> Logout</button>
            </>
          )}
          {/* SOS always visible in mobile menu */}
          <SOSButton />
        </div>
      )}
    </nav>
  );
};

export default Navbar;