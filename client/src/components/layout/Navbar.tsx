import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, PlusCircle, LayoutDashboard, Map, LogOut, Menu, PhoneCall } from 'lucide-react';

// Reusable SOS button — navigates to the dedicated Emergency page
const SOSButton: React.FC = () => (
  <Link
    to="/emergency"
    aria-label="Emergency SOS — Open Emergency Services"
    className="relative inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm rounded-full shadow-lg shadow-red-400/40 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300"
  >
    {/* Pulsing ring */}
    <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
    <PhoneCall size={15} strokeWidth={2.5} className="relative z-10" />
    <span className="relative z-10 tracking-widest">SOS</span>
  </Link>
);

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent italic">
          NagarSetu
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Home size={18} /> Home
          </Link>
          <Link to="/heatmap" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Map size={18} /> Heatmap
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link to="/complaint/new" className="px-4 py-2 bg-indigo-600 text-white rounded-full flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
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
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium transition-colors">Login</Link>
              <Link to="/register" className="px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">Register</Link>
            </div>
          )}
          {/* SOS — always visible on desktop */}
          <SOSButton />
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>
      
      {/* Mobile Menu (Simplified) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(false)}><Home size={18} /> Home</Link>
          <Link to="/heatmap" className="flex items-center gap-2 text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(false)}><Map size={18} /> Heatmap</Link>
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
