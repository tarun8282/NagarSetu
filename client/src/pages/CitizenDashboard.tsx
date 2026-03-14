import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Complaint {
    id: string;
    complaint_number: string;
    title: string;
    status: string;
    created_at: string;
    sla_deadline: string;
    resolved_at?: string;
    complaint_media?: { public_url: string }[];
}

const CitizenDashboard: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                if (!user?.id) return;
                
                const response = await fetch(`/api/complaints?citizen_id=${user.id}`);
                const data = await response.json();
                
                if (data.success) {
                    setComplaints(data.complaints || []);
                } else {
                    setError(data.error || 'Failed to fetch complaints');
                }
            } catch (err: any) {
                setError(err.message || 'Error fetching complaints');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, [user?.id]);

    const calculateStats = () => {
        const total = complaints.length;
        const pending = complaints.filter(c => c.status === 'submitted' || c.status === 'ai_processing').length;
        const active = complaints.filter(c => c.status === 'under_review' || c.status === 'in_progress').length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        return { total, pending, active, resolved };
    };

    const stats = calculateStats();

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-india-green-100 text-india-green-700 border-india-green-200';
            case 'in_progress':
            case 'under_review': return 'bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200';
            case 'submitted':
            case 'ai_processing': return 'bg-saffron-100 text-saffron-700 border-saffron-200';
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
                    { label: 'Total', count: stats.total, icon: <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Clock size={16} /></div> },
                    { label: 'Pending', count: stats.pending, icon: <div className="p-2 bg-saffron-100 rounded-lg text-saffron-600"><AlertCircle size={16} /></div> },
                    { label: 'Active', count: stats.active, icon: <div className="p-2 bg-navy-blue-100 rounded-lg text-navy-blue-600"><Clock size={16} /></div> },
                    { label: 'Resolved', count: stats.resolved, icon: <div className="p-2 bg-india-green-100 rounded-lg text-india-green-600"><CheckCircle2 size={16} /></div> },
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

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin text-saffron-600" size={32} />
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                        <p className="text-slate-600 dark:text-slate-400">No complaints yet. Create your first complaint!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {complaints.map((c) => {
                            const now = new Date();
                            const isResolved = c.status === 'resolved';
                            const deadline = new Date(c.sla_deadline);
                            const referenceTime = isResolved && c.resolved_at ? new Date(c.resolved_at) : now;
                            
                            // calculating difference in hours
                            const msPerHour = 1000 * 60 * 60;
                            const hoursLeft = Math.floor((deadline.getTime() - referenceTime.getTime()) / msPerHour);
                            
                            const actualHoursLeft = hoursLeft;
                            const isResolvedEarly = isResolved && actualHoursLeft >= 0;

                            return (
                                <Link key={c.id} to={`/complaint/${c.id}`} className="group p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-navy-blue-400 dark:hover:border-navy-blue-500 transition-all shadow-sm block">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {c.complaint_media && c.complaint_media.length > 0 && (
                                                <div className="hidden sm:block w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                                                    <img src={c.complaint_media[0].public_url} alt="Complaint Media" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="text-xs font-mono font-bold text-saffron-600 uppercase tracking-tighter">{c.complaint_number}</div>
                                                    <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getStatusStyle(c.status))}>
                                                        {c.status.replace(/_/g, ' ')}
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-navy-blue-600 transition-colors uppercase">{c.title}</h3>
                                                <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    <span>Filed on {new Date(c.created_at).toLocaleDateString()}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>Ward 45</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center gap-4 text-right shrink-0">
                                            {isResolved ? (
                                                <div className="flex flex-col items-end">
                                                    <div className={`text-sm font-black ${isResolvedEarly ? 'text-india-green-600' : 'text-red-500'}`}>
                                                        {isResolvedEarly ? `✓ Solved ${actualHoursLeft}h Early` : `⚠ Missed SLA by ${Math.abs(actualHoursLeft)}h`}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <div className={`text-base font-black ${hoursLeft < 0 ? 'text-red-600' : hoursLeft < 24 ? 'text-amber-600' : 'text-slate-600'}`}>
                                                        {hoursLeft < 0 ? `−${Math.abs(hoursLeft)}h` : `${hoursLeft}h`}
                                                    </div>
                                                    <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">remaining</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple cn utility for the dashboard
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default CitizenDashboard;
