import React, { useEffect, useState } from 'react';
import { Phone, Shield, Flame, Ambulance, AlertTriangle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Service {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  numberColor: string;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
  btnColor: string;
  borderColor: string;
}

const services: Service[] = [
  {
    number: '112',
    title: 'National Emergency',
    subtitle: 'Universal',
    description:
      'All-in-one national emergency number for police, fire, health, and related emergency response.',
    icon: <AlertTriangle size={30} strokeWidth={2} />,
    numberColor: 'text-red-600',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-600',
    btnColor: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    borderColor: 'border-red-100',
  },
  {
    number: '100',
    title: 'Police Helpline',
    subtitle: 'Law & Order',
    description: 'Contact police emergency support for law and order situations in your area.',
    icon: <Shield size={30} strokeWidth={2} />,
    numberColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-600',
    btnColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    borderColor: 'border-blue-100',
  },
  {
    number: '101',
    title: 'Fire Helpline',
    subtitle: 'Fire & Rescue',
    description: 'Contact fire emergency support for fire-related hazards and rescue operations.',
    icon: <Flame size={30} strokeWidth={2} />,
    numberColor: 'text-orange-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    badgeColor: 'bg-orange-100 text-orange-600',
    btnColor: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
    borderColor: 'border-orange-100',
  },
  {
    number: '102',
    title: 'Ambulance',
    subtitle: 'Medical Emergency',
    description: 'National Ambulance Service for medical emergencies and urgent healthcare.',
    icon: <Ambulance size={30} strokeWidth={2} />,
    numberColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-600',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    borderColor: 'border-emerald-100',
  },
];

const Emergency: React.FC = () => {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={17} /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full bg-red-500 transition-opacity duration-300 ${
              pulse ? 'opacity-100' : 'opacity-20'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-red-500">
            Emergency Mode
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-4 pt-14 pb-10">
        {/* SOS Badge */}
        <div className="relative mb-6">
          <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-red-100 ring-2 ring-red-400 flex items-center justify-center">
            <Phone size={34} className="text-red-500" strokeWidth={2} />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3 text-slate-900">
          Emergency{' '}
          <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
            Services
          </span>
        </h1>
        <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
          In a crisis, every second counts. Tap the number below to call immediately.
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {services.map((s) => (
            <div
              key={s.number}
              className={`group flex flex-col bg-white rounded-3xl border ${s.borderColor} shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 gap-5`}
            >
              {/* Top accent */}
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl ${s.iconBg} ${s.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {s.icon}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.badgeColor}`}>
                  {s.subtitle}
                </span>
              </div>

              {/* Number + title */}
              <div>
                <div className={`text-6xl font-black ${s.numberColor} leading-none tracking-tight`}>
                  {s.number}
                </div>
                <div className="text-slate-900 font-bold text-xl mt-1">{s.title}</div>
              </div>

              {/* Description */}
              <p className="text-slate-500 text-sm leading-relaxed flex-1">{s.description}</p>

              {/* Call Button */}
              <a
                href={`tel:${s.number}`}
                aria-label={`Call ${s.title} at ${s.number}`}
                className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl ${s.btnColor} text-white font-bold text-base shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-1`}
              >
                <Phone size={18} strokeWidth={2.5} />
                Call {s.number}
              </a>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-400 text-sm mt-10 flex items-center justify-center gap-1.5">
          <Phone size={13} />
          Tap a button to open your phone dialer.
        </p>
      </div>
    </div>
  );
};

export default Emergency;
