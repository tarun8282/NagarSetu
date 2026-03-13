import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CitizenDashboard: React.FC = () => {
    const { user } = useAuth();

    // Mock complaints for UI development
    const complaints = [
        { id: '1', number: 'MH-MUM-2024-001', title: 'Deep Pothole on S.V. Road', status: 'in_progress', date: '2024-03-12' },
        { id: '2', number: 'MH-MUM-2024-002', title: 'Water Leakage in Bandra West', status: 'resolved', date: '2024-03-10' },
        { id: '3', number: 'MH-MUM-2024-003', title: 'Garbage overflow near station', status: 'submitted', date: '2024-03-13' },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-india-green-100 text-india-green-700 border-india-green-200';
            case 'in_progress': return 'bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200';
            case 'submitted': return 'bg-saffron-100 text-saffron-700 border-saffron-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 dark:opacity-5 text-slate-900 dark:text-white pointer-events-none">
                    <svg width="150" height="150" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                        {[...Array(24)].map((_, i) => (
                          <line key={i} x1="50" y1="50" x2="50" y2="5" stroke="currentColor" strokeWidth="1" transform={`rotate(${i * 15} 50 50)`} />
                        ))}
                    </svg>
                </div>
                <div className="space-y-1 relative z-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-deva">Namaste, {user?.full_name || 'Citizen'}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track and manage your civic complaints.</p>
                </div>
                <Link to="/complaint/new" className="relative z-10 px-6 py-3 bg-saffron text-white rounded-lg font-bold hover:bg-saffron-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-saffron-200 dark:shadow-none">
                    <Plus size={20} /> New Complaint
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', count: 3, icon: <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Clock size={16} /></div> },
                    { label: 'Pending', count: 1, icon: <div className="p-2 bg-saffron-100 rounded-lg text-saffron-600"><AlertCircle size={16} /></div> },
                    { label: 'Active', count: 1, icon: <div className="p-2 bg-navy-blue-100 rounded-lg text-navy-blue-600"><Clock size={16} /></div> },
                    { label: 'Resolved', count: 1, icon: <div className="p-2 bg-india-green-100 rounded-lg text-india-green-600"><CheckCircle2 size={16} /></div> },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                        {stat.icon}
                        <div>
                            <div className="text-2xl font-bold dark:text-white">{stat.count}</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Complaints List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Complaints</h2>
                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-white border border-slate-200 rounded-lg"><Filter size={18} /></button>
                        <button className="p-2 bg-white border border-slate-200 rounded-lg"><Search size={18} /></button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {complaints.map((c) => (
                        <Link key={c.id} to={`/complaint/${c.id}`} className="group p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-navy-blue-400 dark:hover:border-navy-blue-500 transition-all shadow-sm block">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs font-mono font-bold text-saffron-600 uppercase tracking-tighter">{c.number}</div>
                                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-navy-blue-600 transition-colors uppercase">{c.title}</h3>
                                    <div className="text-sm text-slate-500 flex items-center gap-4">
                                        <span>Filed on {new Date(c.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>Ward 45</span>
                                    </div>
                                </div>
                                <div className={cn("px-4 py-1.5 rounded-full text-xs font-bold border capitalize", getStatusStyle(c.status))}>
                                    {c.status.replace('_', ' ')}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Simple cn utility for the dashboard
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default CitizenDashboard;
