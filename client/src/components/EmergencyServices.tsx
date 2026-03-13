import React from 'react';
import { Phone, Shield, Flame, Ambulance } from 'lucide-react';

interface EmergencyCard {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  badge: string;
  badgeColor: string;
}

const services: EmergencyCard[] = [
  {
    number: '112',
    title: 'National Emergency',
    description:
      'All-in-one national emergency number for police, fire, health, and related emergency response.',
    icon: <Shield size={32} strokeWidth={2} />,
    gradient: 'from-red-600 to-rose-500',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    badge: 'Universal',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
  {
    number: '100',
    title: 'Police Helpline',
    description: 'Contact police emergency support for law and order situations.',
    icon: <Shield size={32} strokeWidth={2} />,
    gradient: 'from-blue-600 to-indigo-500',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    badge: 'Police',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  {
    number: '101',
    title: 'Fire Helpline',
    description: 'Contact fire emergency support for fire-related hazards and rescue.',
    icon: <Flame size={32} strokeWidth={2} />,
    gradient: 'from-orange-500 to-amber-500',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    badge: 'Fire',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  },
  {
    number: '102',
    title: 'Ambulance Service',
    description: 'National Ambulance Service for medical emergencies and urgent healthcare.',
    icon: <Ambulance size={32} strokeWidth={2} />,
    gradient: 'from-emerald-600 to-teal-500',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    badge: 'Medical',
    badgeColor:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
];

const EmergencyServices: React.FC = () => {
  return (
    <section className="px-4 py-10">
      {/* Section Header */}
      <div className="max-w-2xl mx-auto text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-semibold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
          Emergency Contacts
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Emergency <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Services</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed">
          In a crisis, every second counts. Tap a button to open your phone dialer instantly.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <div
            key={service.number}
            className="group relative flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${service.gradient}`} />

            <div className="flex flex-col flex-1 p-6 space-y-5">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${service.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                  {service.icon}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${service.badgeColor}`}>
                  {service.badge}
                </span>
              </div>

              {/* Number */}
              <div className={`text-5xl font-black bg-gradient-to-br ${service.gradient} bg-clip-text text-transparent leading-none tracking-tight`}>
                {service.number}
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Call Now Button */}
              <a
                href={`tel:${service.number}`}
                aria-label={`Call ${service.title} at ${service.number}`}
                className={`mt-auto flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r ${service.gradient} text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700`}
              >
                <Phone size={18} strokeWidth={2.5} />
                Call Now
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-8 flex items-center justify-center gap-1.5">
        <Phone size={14} />
        Tap a button to open your phone dialer.
      </p>
    </section>
  );
};

export default EmergencyServices;
