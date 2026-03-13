import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ShieldCheck, Clock } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Ashoka Chakra Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.12] dark:opacity-[0.03] text-saffron dark:text-white select-none pointer-events-none z-0">
          <svg width="600" height="600" viewBox="0 0 100 100" className="animate-[spin_120s_linear_infinite]">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" />
            {[...Array(24)].map((_, i) => (
              <line key={i} x1="50" y1="50" x2="50" y2="5" stroke="currentColor" strokeWidth="1" transform={`rotate(${i * 15} 50 50)`} />
            ))}
          </svg>
        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-saffron/5 blur-[120px] -z-10 rounded-full"></div>
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6 z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white font-deva">
            <span className="text-saffron">Nagar</span><span className="text-india-green">Setu</span>
          </h1>
          <p className="text-2xl text-slate-600 dark:text-slate-400/90 font-medium italic font-deva">
            Connecting citizens to municipal care.
          </p>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Report potholes, water leaks, and garbage issues directly to your municipal corporation. 
            AI-powered classification and real-time tracking until the job is done.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to="/complaint/new" className="w-full sm:w-auto px-8 py-4 bg-saffron text-white rounded-lg text-lg font-bold hover:bg-saffron-600 transition-all shadow-xl shadow-saffron-200 dark:shadow-none flex items-center justify-center gap-2">
              Report an Issue <ArrowRight size={20} />
            </Link>
            <Link to="/heatmap" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
              View Heatmap <MapPin size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <MapPin className="text-saffron" />,
            title: "Smart Reporting",
            desc: "Pin the exact location and upload photos. Our AI does the rest."
          },
          {
            icon: <ShieldCheck className="text-india-green" />,
            title: "AI Routing",
            desc: "Gemini AI automatically classifies and routes your complaint to the right department."
          },
          {
            icon: <Clock className="text-navy-blue-500" />,
            title: "Real-time Tracking",
            desc: "Get live updates as officers work on your complaint. Transparency at every step."
          }
        ].map((feature, i) => (
          <div key={i} className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t-4 border border-slate-200/60 dark:border-slate-700/60 rounded-lg space-y-4 hover:shadow-lg transition-shadow relative overflow-hidden" style={{ borderTopColor: i === 0 ? '#FF9933' : i === 1 ? '#138808' : '#000080' }}>
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-[0.12] dark:opacity-[0.04] text-navy-blue dark:text-white">
               <svg width="100" height="100" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
                 {[...Array(24)].map((_, j) => (
                   <line key={j} x1="50" y1="50" x2="50" y2="5" stroke="currentColor" strokeWidth="2" transform={`rotate(${j * 15} 50 50)`} />
                 ))}
               </svg>
            </div>
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center relative z-10">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Stats Section */}
      <section className="bg-navy-blue text-white py-16 rounded-lg px-8 text-center mx-4 overflow-hidden relative shadow-lg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none z-0 text-white">
          <svg width="800" height="800" viewBox="0 0 100 100" className="animate-[spin_180s_linear_infinite]">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
            {[...Array(24)].map((_, i) => (
              <line key={i} x1="50" y1="50" x2="50" y2="5" stroke="currentColor" strokeWidth="0.5" transform={`rotate(${i * 15} 50 50)`} />
            ))}
          </svg>
        </div>
        
        <div className="relative z-10 space-y-12">
          <div className="space-y-2">
            <div className="text-saffron-300 font-bold tracking-widest uppercase text-xs">Government of India Initiative</div>
            <h2 className="text-3xl font-bold font-deva">Making Cities Better, One Report at a Time</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: "24/7", label: "Availability" },
              { val: "100%", label: "Transparency" },
              { val: "< 10s", label: "AI Classification" },
              { val: "365d", label: "Service" }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className={`text-4xl font-extrabold ${i % 2 === 0 ? 'text-saffron-400' : 'text-india-green-400'}`}>{stat.val}</div>
                <div className="text-slate-300 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
