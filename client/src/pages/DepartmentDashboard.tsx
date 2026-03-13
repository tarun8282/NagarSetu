import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    BarChart3, 
    TrendingUp, 
    AlertTriangle, 
    Users, 
    ArrowRight,
    Search,
    Filter,
    Loader,
    Calendar,
    ChevronRight,
    Inbox,
    Activity,
    Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format, isToday, subDays, differenceInHours, parseISO } from 'date-fns';

interface Complaint {
    id: string;
    complaint_number: string;
    title: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'submitted' | 'ai_processing' | 'under_review' | 'in_progress' | 'resolved' | 'rejected' | 'escalated';
    created_at: string;
    sla_deadline: string;
    resolved_at: string | null;
    citizen_rating: number | null;
    city_id: string;
    assigned_department_id: string;
    ward_number: string;
}

const DepartmentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ==================== DATA FETCHING ====================

    const fetchComplaints = async () => {
        try {
            // RLS handles filtering by department_id and city_id automatically
            const { data, error: fetchError } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setComplaints(data || []);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();

        // Real-time subscription
        const subscription = supabase
            .channel('officer_dashboard_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'complaints' 
            }, () => {
                fetchComplaints();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // ==================== CALCULATIONS ====================

    const stats = useMemo(() => {
        const total = complaints.length;
        const pending = complaints.filter(c => ['submitted', 'ai_processing', 'under_review'].includes(c.status)).length;
        const inProgress = complaints.filter(c => c.status === 'in_progress').length;
        const resolvedToday = complaints.filter(c => c.status === 'resolved' && c.resolved_at && isToday(parseISO(c.resolved_at))).length;
        
        const now = new Date();
        const slaBreaches = complaints.filter(c => 
            c.status !== 'resolved' && 
            c.sla_deadline && 
            parseISO(c.sla_deadline) < now
        ).length;

        // Resolution Time
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.resolved_at);
        let avgResTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalHours = resolvedComplaints.reduce((acc, c) => {
                const diff = differenceInHours(parseISO(c.resolved_at!), parseISO(c.created_at));
                return acc + diff;
            }, 0);
            avgResTime = Math.round(totalHours / resolvedComplaints.length);
        }

        return { total, pending, inProgress, resolvedToday, slaBreaches, avgResTime };
    }, [complaints]);

    const priorityCounts = useMemo(() => {
        return {
            low: complaints.filter(c => c.priority === 'low').length,
            medium: complaints.filter(c => c.priority === 'medium').length,
            high: complaints.filter(c => c.priority === 'high').length,
            critical: complaints.filter(c => c.priority === 'critical').length,
        };
    }, [complaints]);

    const slaRiskComplaints = useMemo(() => {
        const now = new Date();
        return complaints
            .filter(c => c.status !== 'resolved' && c.status !== 'rejected')
            .map(c => {
                const deadline = parseISO(c.sla_deadline);
                const hoursLeft = differenceInHours(deadline, now);
                return { ...c, hoursLeft };
            })
            .filter(c => c.hoursLeft < 24)
            .sort((a, b) => a.hoursLeft - b.hoursLeft)
            .slice(0, 5);
    }, [complaints]);

    const categoryDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        complaints.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [complaints]);

    const perfMetrics = useMemo(() => {
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const totalResolved = complaints.filter(c => c.status === 'resolved').length;
        
        const resolutionRate = complaints.length > 0 ? (resolved / complaints.length) * 100 : 0;
        
        const slaCompliant = complaints.filter(c => 
            c.status === 'resolved' && 
            c.resolved_at && 
            c.sla_deadline && 
            parseISO(c.resolved_at) <= parseISO(c.sla_deadline)
        ).length;
        
        const slaComplianceRate = totalResolved > 0 ? (slaCompliant / totalResolved) * 100 : 0;

        const ratings = complaints.filter(c => c.citizen_rating).map(c => c.citizen_rating!);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

        return { resolutionRate, slaComplianceRate, avgRating };
    }, [complaints]);

    // ==================== STYLES ====================

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-india-green-100 text-india-green-700 border-india-green-200';
            case 'in_progress':
            case 'under_review': return 'bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200';
            case 'escalated':
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-saffron-100 text-saffron-700 border-saffron-200';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-600 text-white';
            case 'high': return 'bg-saffron text-white';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="w-12 h-12 animate-spin text-saffron" />
                <p className="text-slate-500 font-medium font-deva animate-pulse">प्रतीक्षा करें... Loading insights</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* 1. Dashboard Header */}
            <header className="bg-navy-blue text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-navy-blue-800">
                {/* Background Decorations */}
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <svg width="400" height="400" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
                        {[...Array(24)].map((_, i) => (
                          <line key={i} x1="50" y1="50" x2="50" y2="5" stroke="currentColor" strokeWidth="0.5" transform={`rotate(${i * 15} 50 50)`} />
                        ))}
                    </svg>
                </div>
                
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-saffron-300 font-bold tracking-widest text-xs uppercase">
                        <Activity className="w-4 h-4" /> Operational Command Center
                    </div>
                    <h1 className="text-4xl font-extrabold font-deva tracking-tight">
                        {user?.departments?.name || 'Department'} DashBoard
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-300 pt-2">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm">
                            <Users className="w-4 h-4" /> {user?.full_name}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm">
                            <Target className="w-4 h-4" /> {user?.cities?.name} {user?.role?.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm">
                            <Calendar className="w-4 h-4" /> {format(new Date(), 'dd MMMM yyyy')}
                        </span>
                    </div>
                </div>
            </header>

            {/* 2. Key Metrics Summary */}
            <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: <Inbox className="w-5 h-5" />, color: 'bg-navy-blue-50 text-navy-blue-700 border-navy-blue-100' },
                    { label: 'Pending', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'bg-saffron-50 text-saffron-700 border-saffron-100' },
                    { label: 'In Progress', value: stats.inProgress, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                    { label: 'Resolved Today', value: stats.resolvedToday, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-india-green-50 text-india-green-700 border-india-green-100' },
                    { label: 'SLA Breaches', value: stats.slaBreaches, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-700 border-red-100' },
                    { label: 'Avg Res Time', value: `${stats.avgResTime}h`, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-slate-50 text-slate-700 border-slate-100' },
                ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${stat.color} flex flex-col justify-between shadow-sm hover:shadow-md transition-all`}>
                        <div className="p-2 w-fit rounded-lg bg-white/60 mb-3">{stat.icon}</div>
                        <div>
                            <div className="text-2xl font-black">{stat.value}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </section>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column - Operational Focus */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Recent Complaints */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-navy-blue" /> Recently Assigned
                            </h2>
                            <Link to="/officer/complaints" className="text-saffron font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                View Queue <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {complaints.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-medium">No complaints assigned to your department.</div>
                            ) : (
                                complaints.slice(0, 5).map(c => (
                                    <Link key={c.id} to={`/complaint/${c.id}`} className="flex items-center p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono font-bold text-saffron-600 bg-saffron-50 px-2 rounded tracking-tighter uppercase">{c.complaint_number}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${getPriorityStyle(c.priority)}`}>{c.priority}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-navy-blue transition-colors uppercase truncate max-w-md">{c.title}</h3>
                                            <div className="text-xs text-slate-500 flex items-center gap-3">
                                                <span>Ward {c.ward_number || 'N/A'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(parseISO(c.created_at), 'HH:mm dd MMM')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(c.status)}`}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-navy-blue group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SLA Risk Monitor */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden border-l-4 border-l-red-500">
                        <div className="p-6 bg-red-50/50 dark:bg-red-900/5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="font-bold text-lg flex items-center gap-2 text-red-700">
                                <AlertTriangle className="w-5 h-5" /> SLA Risk Monitor
                            </h2>
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse uppercase">Attention Required</span>
                        </div>
                        <div className="p-0">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                                    <tr>
                                        <th className="px-6 py-3">Complaint</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Deadline Remaining</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {slaRiskComplaints.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-medium">No complaints at immediate SLA risk. Excellent!</td></tr>
                                    ) : (
                                        slaRiskComplaints.map(c => (
                                            <tr key={c.id} className="hover:bg-red-50/20 dark:hover:bg-red-900/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-mono font-bold text-saffron-600 tracking-tighter uppercase">{c.complaint_number}</div>
                                                    <div className="font-bold text-slate-800 dark:text-white text-sm uppercase truncate max-w-[200px]">{c.title}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getStatusStyle(c.status)}`}>{c.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-black text-lg ${c.hoursLeft < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {c.hoursLeft < 0 ? `Lapsed (${Math.abs(c.hoursLeft)}h)` : `${c.hoursLeft}h left`}
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 ml-auto overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${c.hoursLeft < 6 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                                            style={{ width: `${Math.max(0, Math.min(100, (c.hoursLeft / 24) * 100))}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column - Analytics & Info */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Performance Indicators */}
                    <div className="bg-navy-blue text-white rounded-3xl p-8 shadow-xl space-y-6">
                        <h2 className="font-bold text-xl flex items-center gap-2 border-b border-white/10 pb-4">
                            <TrendingUp className="w-6 h-6 text-saffron" /> Department Efficiency
                        </h2>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'Resolution Rate', value: Math.round(perfMetrics.resolutionRate), target: 85, suffix: '%' },
                                { label: 'SLA Compliance', value: Math.round(perfMetrics.slaComplianceRate), target: 90, suffix: '%' },
                            ].map((p, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="opacity-70 uppercase tracking-widest text-[10px]">{p.label}</span>
                                        <span>{p.value}{p.suffix}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${p.value >= p.target ? 'bg-india-green-400' : 'bg-saffron'}`}
                                            style={{ width: `${p.value}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-white/40 flex justify-between">
                                        <span>Current Performance</span>
                                        <span>Target: {p.target}%</span>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 flex items-center justify-between border-t border-white/10">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Citizen Trust</div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Target key={i} className={`w-4 h-4 ${i < Math.round(perfMetrics.avgRating) ? 'text-india-green-400 fill-india-green-400' : 'text-white/20'}`} />
                                        ))}
                                        <span className="ml-2 font-black text-lg">{perfMetrics.avgRating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Rank</div>
                                    <div className="text-2xl font-black text-saffron">#4 <span className="text-xs opacity-50">in {user?.cities?.name}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Priority & Categories */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                        {/* Priority Bars */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                                Workload by Priority <span>Total {stats.total}</span>
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Critical', count: priorityCounts.critical, color: 'bg-red-600' },
                                    { label: 'High', count: priorityCounts.high, color: 'bg-saffron' },
                                    { label: 'Medium', count: priorityCounts.medium, color: 'bg-amber-400' },
                                    { label: 'Low', count: priorityCounts.low, color: 'bg-slate-300' },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-16 text-[10px] font-bold text-slate-500 uppercase">{p.label}</div>
                                        <div className="flex-1 h-3 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden flex">
                                            <div 
                                                className={`h-full ${p.color} transition-all duration-1000`} 
                                                style={{ width: stats.total > 0 ? `${(p.count / stats.total) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <div className="w-8 text-xs font-black text-slate-700 dark:text-slate-300 text-right">{p.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Categories */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Top Categories</h3>
                            <div className="space-y-2">
                                {categoryDistribution.map(([cat, count], i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{cat.replace(/_/g, ' ')}</div>
                                        <div className="text-xs font-black bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">{count}</div>
                                    </div>
                                ))}
                                {categoryDistribution.length === 0 && <div className="text-xs text-center p-4 text-slate-400 italic">No category data yet</div>}
                            </div>
                        </div>
                    </div>

                    {/* Quick Navigation Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/officer/complaints" className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-saffron transition-all shadow-sm flex flex-col items-center gap-2 group text-center">
                            <div className="p-2 rounded-xl bg-saffron-50 text-saffron group-hover:bg-saffron group-hover:text-white transition-colors"><Inbox className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Full Queue</span>
                        </Link>
                        <Link to="/officer/complaints?priority=high,critical" className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-400 transition-all shadow-sm flex flex-col items-center gap-2 group text-center">
                            <div className="p-2 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><AlertTriangle className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Priority Filter</span>
                        </Link>
                        <Link to="/officer/complaints?status=sla_risk" className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 transition-all shadow-sm flex flex-col items-center gap-2 group text-center">
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors"><Clock className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Risk Analysis</span>
                        </Link>
                        <Link to="/officer/analytics" className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-navy-blue transition-all shadow-sm flex flex-col items-center gap-2 group text-center">
                            <div className="p-2 rounded-xl bg-navy-blue-50 text-navy-blue group-hover:bg-navy-blue group-hover:text-white transition-colors"><BarChart3 className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Deep Analytics</span>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DepartmentDashboard;

