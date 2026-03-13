import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-white pt-12 pb-8 mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-saffron to-india-green bg-clip-text text-transparent">NagarSetu</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-4">
              A comprehensive system connecting citizens directly to their municipal corporations to report issues, track progress, and improve our cities together.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-100 border-b border-slate-700 pb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/heatmap" className="text-slate-400 hover:text-white transition-colors">Incident Heatmap</Link></li>
              <li><Link to="/complaint/new" className="text-slate-400 hover:text-white transition-colors">Report an Issue</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-100 border-b border-slate-700 pb-2">Connect</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} NagarSetu Initiative. By the people, for the people.
            <span className="block mt-1 text-xs opacity-60">A Vision for a Clean, Digitally Connected India</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
