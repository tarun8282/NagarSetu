import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    BarChart3, 
    TrendingUp, 
    AlertTriangle, 
    Users, 
    ArrowRight,
    Loader,
    Calendar,
    Inbox,
    Activity,
    Target,
    Zap,
    Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format, isToday, differenceInHours, parseISO } from 'date-fns';
import useSocket from '../hooks/useSocket';

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
    const [liveUpdate, setLiveUpdate] = useState(false);

    const fetchComplaints = useCallback(async () => {
        try {
            if (!user?.department_id) {
                console.warn('No department_id found for officer');
                setLoading(false);
                return;
            }

            let query = supabase
                .from('complaints')
                .select('*')
                .eq('assigned_department_id', user.department_id);

            // If city_id is present, filter by it too
            if (user.city_id) query = query.eq('city_id', user.city_id);
            // If ward_number is present (some officers might be ward-specific)
            if (user.ward_number) query = query.eq('ward_number', user.ward_number);

            const { data, error: fetchError } = await query.order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            setComplaints(data || []);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

    // 🔌 Real-time via Socket.IO (city room)
    useSocket({
        room: user?.city_id ? `city:${user.city_id}` : undefined,
        events: {
            'complaint:change': () => {
                setLiveUpdate(true);
                fetchComplaints();
                setTimeout(() => setLiveUpdate(false), 3000);
            },
        },
    });

    // ── Computed Stats ──
    const stats = useMemo(() => {
        const total = complaints.length;
        const pending = complaints.filter(c => ['submitted', 'ai_processing', 'under_review'].includes(c.status)).length;
        const inProgress = complaints.filter(c => c.status === 'in_progress').length;
        const resolvedToday = complaints.filter(c => c.status === 'resolved' && c.resolved_at && isToday(parseISO(c.resolved_at))).length;
        const now = new Date();
        const slaBreaches = complaints.filter(c => c.status !== 'resolved' && c.sla_deadline && parseISO(c.sla_deadline) < now).length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.resolved_at);
        let avgResTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalHours = resolvedComplaints.reduce((acc, c) => acc + differenceInHours(parseISO(c.resolved_at!), parseISO(c.created_at)), 0);
            avgResTime = Math.round(totalHours / resolvedComplaints.length);
        }
        return { total, pending, inProgress, resolvedToday, slaBreaches, avgResTime };
    }, [complaints]);

    const priorityCounts = useMemo(() => ({
        low: complaints.filter(c => c.priority === 'low').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        high: complaints.filter(c => c.priority === 'high').length,
        critical: complaints.filter(c => c.priority === 'critical').length,
    }), [complaints]);

    const categoryDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [complaints]);

    const perfMetrics = useMemo(() => {
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const resolutionRate = complaints.length > 0 ? (resolved / complaints.length) * 100 : 0;
        const slaCompliant = complaints.filter(c =>
            c.status === 'resolved' && c.resolved_at && c.sla_deadline &&
            parseISO(c.resolved_at) <= parseISO(c.sla_deadline)
        ).length;
        const slaComplianceRate = resolved > 0 ? (slaCompliant / resolved) * 100 : 0;
        const ratings = complaints.filter(c => c.citizen_rating).map(c => c.citizen_rating!);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        return { resolutionRate, slaComplianceRate, avgRating };
    }, [complaints]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="w-10 h-10 animate-spin text-[#FF9933]" />
                <p className="text-slate-400 text-sm animate-pulse">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-red-500">
                <AlertCircle className="w-10 h-10" />
                <p className="font-semibold">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-12 max-w-7xl mx-auto">

            {/* ═══ HEADER ═══ */}
            <header className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #e67300 100%)' }}>
                <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5">
                            <Activity className="w-3 h-3" /> Command Center
                        </p>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight font-deva leading-tight">
                            {user?.departments?.name || 'Department'} Dashboard
                        </h1>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {[
                                { icon: <Users className="w-3 h-3" />, t: user?.full_name || 'Officer' },
                                { icon: <Target className="w-3 h-3" />, t: `${user?.cities?.name || 'City'} · ${(user?.role || 'officer').replace('_', ' ')}` },
                                { icon: <Calendar className="w-3 h-3" />, t: format(new Date(), 'dd MMM yyyy') },
                            ].map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-[10px] text-white/90">{tag.icon} {tag.t}</span>
                            ))}
                        </div>
                    </div>
                    <Link to="/officer/complaints"
                        className="self-start sm:self-center flex items-center gap-2 px-5 py-2 bg-white text-[#e67300] font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap">
                        <Inbox className="w-4 h-4" /> View Queue <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </header>

            {/* ═══ STAT TILES ═══ */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total',          val: stats.total,             Icon: Inbox,         color: '#FF9933' },
                    { label: 'Pending',         val: stats.pending,           Icon: Clock,         color: '#d97706' },
                    { label: 'In Progress',     val: stats.inProgress,        Icon: TrendingUp,    color: '#FF9933' },
                    { label: 'Resolved Today',  val: stats.resolvedToday,     Icon: CheckCircle2,  color: '#138808' },
                    { label: 'SLA Breach',      val: stats.slaBreaches,       Icon: AlertTriangle, color: '#dc2626' },
                    { label: 'Avg Res Time',    val: `${stats.avgResTime}h`,  Icon: BarChart3,     color: '#FF9933' },
                ].map(({ label, val, Icon, color }, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 hover:shadow-md transition-all group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: color + '12', color }}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{val}</div>
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* ═══ ROW 1: Queue CTA + Efficiency ═══ */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Queue CTA — spans 2 cols */}
                <Link to="/officer/complaints"
                    className="lg:col-span-2 group flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 px-6 py-5 hover:border-[#FF9933]/40 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FF993318', color: '#FF9933' }}>
                            <Inbox className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">Complaint Queue</p>
                            <p className="text-sm text-slate-400 mt-0.5">
                                {complaints.length > 0
                                    ? `${complaints.length} complaint${complaints.length > 1 ? 's' : ''} assigned to your department`
                                    : 'No complaints assigned yet'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#FF9933] font-bold group-hover:gap-3 transition-all">
                        View All <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>

                {/* Efficiency — 1 col */}
                <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #FF9933, #e67300)' }}>
                    <h2 className="text-xs font-bold flex items-center gap-1.5 border-b border-white/15 pb-2.5 mb-3 uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4" /> Efficiency
                    </h2>
                    {[
                        { label: 'Resolution Rate', value: Math.round(perfMetrics.resolutionRate), target: 85 },
                        { label: 'SLA Compliance',  value: Math.round(perfMetrics.slaComplianceRate), target: 90 },
                    ].map((p, i) => (
                        <div key={i} className="mb-3">
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-white/70">{p.label}</span>
                                <span>{p.value}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${p.value}%`, backgroundColor: p.value >= p.target ? '#138808' : '#fff' }} />
                            </div>
                        </div>
                    ))}
                    <div className="border-t border-white/15 pt-2.5 flex items-center justify-between mt-1">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(perfMetrics.avgRating) ? 'fill-white text-white' : 'text-white/25'}`} />
                            ))}
                            <span className="ml-1 font-black text-sm">{perfMetrics.avgRating.toFixed(1)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black">#4</span>
                            <span className="text-xs text-white/50 ml-1">in {user?.cities?.name || 'City'}</span>
                        </div>
                    </div>
                </div>
            </div>



            {/* ═══ ROW 3: Quick Actions + Priority + Categories ═══ */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { to: '/officer/complaints',                         icon: <Inbox className="w-4 h-4" />,         label: 'Full Queue', color: '#FF9933' },
                            { to: '/officer/complaints?priority=high,critical',  icon: <AlertTriangle className="w-4 h-4" />, label: 'Priority',   color: '#dc2626' },
                            { to: '/officer/complaints?status=sla_risk',         icon: <Zap className="w-4 h-4" />,           label: 'SLA Risk',   color: '#d97706' },
                            { to: '/officer/analytics',                          icon: <BarChart3 className="w-4 h-4" />,     label: 'Analytics',  color: '#138808' },
                        ].map(({ to, icon, label, color }, i) => (
                            <Link key={i} to={to}
                                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-sm hover:-translate-y-0.5 transition-all text-center">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: color + '12', color }}>
                                    {icon}
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority Breakdown</h3>
                        <span className="text-xs font-black text-slate-500">{stats.total} total</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Critical', count: priorityCounts.critical, color: '#dc2626' },
                            { label: 'High',     count: priorityCounts.high,     color: '#FF9933' },
                            { label: 'Medium',   count: priorityCounts.medium,   color: '#f59e0b' },
                            { label: 'Low',      count: priorityCounts.low,      color: '#138808' },
                        ].map((p, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                <span className="w-14 text-xs font-semibold text-slate-500">{p.label}</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                        style={{ width: stats.total > 0 ? `${(p.count / stats.total) * 100}%` : '0%', backgroundColor: p.color }} />
                                </div>
                                <span className="w-6 text-xs font-black text-slate-600 dark:text-slate-300 text-right">{p.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Top Categories</h3>
                    {categoryDistribution.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-slate-400 text-sm">No data yet</div>
                    ) : (
                        <div className="space-y-2">
                            {categoryDistribution.map(([cat, count], i) => (
                                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">{cat.replace(/_/g, ' ')}</span>
                                    <span className="text-xs font-black px-2 py-0.5 rounded" style={{ color: '#FF9933', backgroundColor: '#FF993312' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepartmentDashboard;
