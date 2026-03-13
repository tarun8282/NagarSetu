import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, Target, Activity } from 'lucide-react';

const OfficerAnalytics: React.FC = () => {
    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="space-y-1">
                <Link to="/officer/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-navy-blue transition-all font-bold group mb-2">
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Dashboard
                </Link>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase font-deva">Department Analytics</h1>
                <p className="text-slate-500 font-medium">Detailed performance metrics and trend analysis.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Avg Resolution Time', value: '14.2h', change: '-2.4h', icon: <TrendingUp className="text-india-green-600" /> },
                    { label: 'SLA Compliance', value: '94.2%', change: '+1.2%', icon: <Target className="text-saffron" /> },
                    { label: 'Active Officers', value: '12', change: 'Stable', icon: <Users className="text-navy-blue" /> },
                    { label: 'Growth Rate', value: '+12%', change: '+2%', icon: <Activity className="text-india-green-600" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="p-3 w-fit rounded-2xl bg-slate-50 dark:bg-slate-900 mb-4">{stat.icon}</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                        <div className="flex items-center justify-between mt-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                            <div className="text-[10px] font-black text-india-green-600">{stat.change}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm h-96 flex flex-col items-center justify-center text-center">
                    <BarChart3 size={64} className="text-slate-200 mb-4" />
                    <h3 className="font-bold text-slate-400 uppercase tracking-widest">Monthly Complaint Volume</h3>
                    <p className="text-xs text-slate-400">Visualization Component Coming Soon</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm h-96 flex flex-col items-center justify-center text-center">
                    <Activity size={64} className="text-slate-200 mb-4" />
                    <h3 className="font-bold text-slate-400 uppercase tracking-widest">Category-wise Resolution Rates</h3>
                    <p className="text-xs text-slate-400">Visualization Component Coming Soon</p>
                </div>
            </div>
        </div>
    );
};

export default OfficerAnalytics;
