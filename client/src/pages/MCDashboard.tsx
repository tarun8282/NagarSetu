import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, AlertTriangle, CheckCircle2, Clock,
    TrendingUp, ChevronRight, ArrowLeft,
    Inbox, Activity, Users, Calendar, BarChart3,
    Search, Filter, Zap, ArrowRight,
    Megaphone, Map as MapIcon, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMCDashboard, MCDepartment, MCComplaint } from '../api/mc';
import { format, differenceInHours, parseISO, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import RaiseAlertModal from '../components/alerts/RaiseAlertModal';
import useSocket from '../hooks/useSocket';

/* ─── Helpers ───────────────────────────────────────────────── */
const PRIORITY_COLOR: Record<string, string> = {
    critical: '#dc2626', high: '#FF9933', medium: '#f59e0b', low: '#138808',
};

const STATUS_COLOR: Record<string, string> = {
    resolved: 'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-amber-50 text-amber-700',
    under_review: 'bg-orange-50 text-orange-600',
    escalated: 'bg-red-50 text-red-600',
    rejected: 'bg-slate-100 text-slate-500',
    submitted: 'bg-orange-50 text-orange-600',
    ai_processing: 'bg-blue-50 text-blue-600',
};

const DEPT_ICONS: Record<string, string> = {
    pwd: '🏗️', water: '💧', solidwaste: '♻️', sewerage: '🚰',
    building: '🏢', townplanning: '🗺️', environment: '🌿',
    health: '🏥', gardens: '🌳', fire: '🔥', admin: '⚙️',
    electricity: '⚡', traffic: '🚦',
};

/* ─── Main Component ────────────────────────────────────────── */
const MCDashboard: React.FC = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState<MCDepartment[]>([]);
    const [complaints, setComplaints] = useState<MCComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<MCDepartment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

    const cityId = user?.city_id;

    const loadData = useCallback(async () => {
        if (!cityId) {
            setError('No city_id found on your account. Please contact your administrator.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchMCDashboard(cityId);
            setDepartments(data.departments);
            setComplaints(data.complaints);
        } catch (err: any) {
            console.error('MCDashboard fetch error:', err);
            setError(err?.response?.data?.error || err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [cityId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 🔌 Real-time via Socket.IO — join city room, refresh on any complaint change
    const [liveUpdate, setLiveUpdate] = useState(false);
    useSocket({
        room: cityId ? `city:${cityId}` : undefined,
        events: {
            'complaint:change': () => {
                setLiveUpdate(true);
                loadData();
                setTimeout(() => setLiveUpdate(false), 3000);
            },
        },
    });

    /* City-wide stats */
    const cityStats = useMemo(() => {
        const total = complaints.length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const pending = complaints.filter(c => ['submitted', 'ai_processing', 'under_review'].includes(c.status)).length;
        const inProgress = complaints.filter(c => c.status === 'in_progress').length;
        const now = new Date();
        const slaBreaches = complaints.filter(c => c.status !== 'resolved' && c.sla_deadline && parseISO(c.sla_deadline) < now).length;
        const resolvedToday = complaints.filter(c => c.status === 'resolved' && c.resolved_at && isToday(parseISO(c.resolved_at))).length;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        return { total, resolved, pending, inProgress, slaBreaches, resolvedToday, resolutionRate };
    }, [complaints]);

    /* Per-department complaint counts */
    const deptStats = useMemo(() => {
        const map: Record<string, { total: number; resolved: number; slaRisk: number; critical: number }> = {};
        const now = new Date();
        complaints.forEach(c => {
            const did = c.assigned_department_id;
            if (!did) return;
            if (!map[did]) map[did] = { total: 0, resolved: 0, slaRisk: 0, critical: 0 };
            map[did].total++;
            if (c.status === 'resolved') map[did].resolved++;
            if (c.status !== 'resolved' && c.sla_deadline && differenceInHours(parseISO(c.sla_deadline), now) < 24) map[did].slaRisk++;
            if (c.priority === 'critical') map[did].critical++;
        });
        return map;
    }, [complaints]);

    /* Complaints for selected department, filtered */
    const deptComplaints = useMemo(() => {
        if (!selectedDept) return [];
        return complaints
            .filter(c => c.assigned_department_id === selectedDept.id)
            .filter(c => {
                const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.complaint_number.toLowerCase().includes(searchTerm.toLowerCase());
                const matchStatus = statusFilter === 'all' ? true : c.status === statusFilter;
                return matchSearch && matchStatus;
            });
    }, [complaints, selectedDept, searchTerm, statusFilter]);

    const handleAlertSuccess = (msg: string) => {
        setAlertSuccess(msg);
        setTimeout(() => setAlertSuccess(null), 5000);
    };

    /* ── LOADING ── */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-[#FF9933]/20 border-t-[#FF9933] animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse">Loading Municipal Corporation data…</p>
            </div>
        );
    }

    /* ── ERROR ── */
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Failed to Load Dashboard</h3>
                    <p className="text-slate-400 text-sm max-w-sm">{error}</p>
                    {!cityId && (
                        <p className="text-slate-400 text-xs mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                            Your account's <code className="text-[#FF9933]">city_id</code> is not set.
                            Ask your administrator to assign it in the officers table.
                        </p>
                    )}
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF9933] text-white font-bold text-sm hover:opacity-90 transition"
                >
                    <RefreshCw className="w-4 h-4" /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-12 max-w-7xl mx-auto">

            {/* ═══ HEADER ═══ */}
            <header className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #e67300 100%)' }}>
                <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" /> Municipal Corporation Command Center
                        </p>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                            {(user as any)?.cities?.name || user?.city_id?.slice(0, 8) || 'City'}{' '}
                            <span className="font-light opacity-80">Municipality</span>
                        </h1>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {[
                                { icon: <Users className="w-3 h-3" />, t: user?.full_name || 'MC Admin' },
                                { icon: <Activity className="w-3 h-3" />, t: `${departments.length} departments active` },
                                { icon: <Calendar className="w-3 h-3" />, t: format(new Date(), 'dd MMM yyyy') },
                            ].map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-[10px] text-white/90">{tag.icon} {tag.t}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 self-start sm:self-center">
                        <button
                            onClick={loadData}
                            title="Refresh data"
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/15 text-white font-bold text-sm rounded-xl hover:bg-white/25 transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsAlertModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#e67300] font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                        >
                            <Megaphone className="w-4 h-4" /> Broadcast Alert
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══ CITY-WIDE STATS ═══ */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total', val: cityStats.total, Icon: Inbox, color: '#FF9933' },
                    { label: 'Pending', val: cityStats.pending, Icon: Clock, color: '#d97706' },
                    { label: 'In Progress', val: cityStats.inProgress, Icon: TrendingUp, color: '#FF9933' },
                    { label: 'Resolved Today', val: cityStats.resolvedToday, Icon: CheckCircle2, color: '#138808' },
                    { label: 'SLA Breaches', val: cityStats.slaBreaches, Icon: AlertTriangle, color: '#dc2626' },
                    { label: 'Resolution %', val: `${cityStats.resolutionRate}%`, Icon: BarChart3, color: '#138808' },
                ].map(({ label, val, Icon, color }, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 hover:shadow-md transition-all">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: color + '12', color }}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{val}</div>
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            {!selectedDept ? (
                /* ── DEPARTMENT GRID ── */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#FF9933]" />
                            Departments
                            <span className="text-sm font-normal text-slate-400">({departments.length})</span>
                        </h2>
                        <p className="text-xs text-slate-400">Click a department to view its complaints</p>
                    </div>

                    {departments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                <Building2 className="w-7 h-7 text-slate-300" />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">No Departments Found</h3>
                            <p className="text-slate-400 text-sm">No departments are configured for this city yet.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {departments.map((dept, idx) => {
                                const ds = deptStats[dept.id] || { total: 0, resolved: 0, slaRisk: 0, critical: 0 };
                                const rate = ds.total > 0 ? Math.round((ds.resolved / ds.total) * 100) : 0;
                                const hasRisk = ds.slaRisk > 0;
                                const hasCritical = ds.critical > 0;
                                const emoji = DEPT_ICONS[dept.category_slug] || '🏛️';

                                return (
                                    <motion.button
                                        key={dept.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        onClick={() => { setSelectedDept(dept); setSearchTerm(''); setStatusFilter('all'); }}
                                        className={`text-left rounded-xl border-2 p-5 hover:shadow-lg transition-all group hover:-translate-y-0.5 ${
                                            hasRisk || hasCritical
                                                ? 'border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 hover:border-red-300'
                                                : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#FF9933]/40'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                                style={{ backgroundColor: '#FF993315' }}>
                                                {emoji}
                                            </div>
                                            <div className="flex gap-1.5">
                                                {hasCritical && (
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase">
                                                        {ds.critical} Critical
                                                    </span>
                                                )}
                                                {hasRisk && (
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">
                                                        {ds.slaRisk} SLA
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug mb-1 group-hover:text-[#FF9933] transition-colors">
                                            {dept.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">
                                            {dept.category_slug} · {dept.sla_hours}h SLA
                                        </p>

                                        <div className="flex items-center justify-between text-xs mb-3">
                                            <span className="font-black text-slate-700 dark:text-slate-200">{ds.total}</span>
                                            <span className="text-slate-400">complaints</span>
                                            <span className="font-black" style={{ color: rate >= 80 ? '#138808' : rate >= 50 ? '#FF9933' : '#dc2626' }}>
                                                {rate}%
                                            </span>
                                        </div>

                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${rate}%` }}
                                                transition={{ duration: 0.8, delay: idx * 0.04 + 0.3 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: rate >= 80 ? '#138808' : rate >= 50 ? '#FF9933' : '#dc2626' }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">
                                                {ds.resolved}/{ds.total} resolved
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF9933] group-hover:gap-2 transition-all">
                                                View <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── Bottom Analytics Row ─── */}
                    <div className="grid lg:grid-cols-2 gap-5 mt-1">

                        {/* Department Performance Leaderboard */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2 mb-5">
                                <TrendingUp className="w-4 h-4 text-[#FF9933]" /> Department Performance
                            </h3>
                            {departments.length === 0 ? (
                                <p className="text-slate-400 text-xs text-center py-8">No department data available.</p>
                            ) : (
                                <div className="space-y-4">
                                    {[...departments]
                                        .map(d => {
                                            const ds = deptStats[d.id] || { total: 0, resolved: 0 };
                                            const rate = ds.total > 0 ? Math.round((ds.resolved / ds.total) * 100) : 0;
                                            return { ...d, rate, ds };
                                        })
                                        .sort((a, b) => b.rate - a.rate)
                                        .slice(0, 6)
                                        .map((d, i) => (
                                            <div key={d.id}>
                                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        <span>{DEPT_ICONS[d.category_slug] || '🏛️'}</span>
                                                        {d.name}
                                                    </span>
                                                    <span className="font-black" style={{ color: d.rate >= 80 ? '#138808' : d.rate >= 50 ? '#FF9933' : '#dc2626' }}>
                                                        {d.rate}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${d.rate}%` }}
                                                        transition={{ duration: 0.9, delay: i * 0.06 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: d.rate >= 80 ? '#138808' : d.rate >= 50 ? '#FF9933' : '#dc2626' }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{d.ds.resolved}/{d.ds.total} resolved</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* City Heatmap Card */}
                        <div className="rounded-xl relative overflow-hidden group min-h-[220px]"
                            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570160897040-d8229fb9c922?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-15 transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />

                            <div className="relative z-10 h-full p-6 flex flex-col justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#FF9933]/20 flex items-center justify-center">
                                            <MapIcon className="w-4 h-4 text-[#FF9933]" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF9933]">Live Analytics</span>
                                    </div>
                                    <h3 className="text-white text-xl font-extrabold tracking-tight">City Hotspot Map</h3>
                                    <p className="text-slate-400 text-xs mt-1">
                                        Visualise complaint density across all wards &amp; pinpoint high-risk zones in real time.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Total Complaints', val: cityStats.total, color: '#FF9933' },
                                        { label: 'SLA Breaches', val: cityStats.slaBreaches, color: '#dc2626' },
                                        { label: 'Resolution', val: `${cityStats.resolutionRate}%`, color: '#138808' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} className="px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm"
                                            style={{ backgroundColor: color + '18' }}>
                                            <div className="text-xs font-black" style={{ color }}>{val}</div>
                                            <div className="text-[9px] text-white/50 uppercase tracking-wider">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    to="/heatmap"
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white border border-white/10 bg-white/10 hover:bg-[#FF9933]/20 hover:border-[#FF9933]/50 transition-all backdrop-blur-sm group/btn"
                                >
                                    Explore Heatmap
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── DEPARTMENT COMPLAINT VIEW ── */
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedDept.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        {/* Sub-header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <button
                                    onClick={() => setSelectedDept(null)}
                                    className="flex items-center gap-1.5 text-slate-400 hover:text-[#FF9933] text-xs font-bold mb-2 transition-colors group"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> All Departments
                                </button>
                                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="text-2xl">{DEPT_ICONS[selectedDept.category_slug] || '🏛️'}</span>
                                    {selectedDept.name}
                                </h2>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    {selectedDept.category_slug} · SLA: {selectedDept.sla_hours}h
                                    {selectedDept.helpline && ` · ☎ ${selectedDept.helpline}`}
                                </p>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {(() => {
                                    const ds = deptStats[selectedDept.id] || { total: 0, resolved: 0, slaRisk: 0, critical: 0 };
                                    return [
                                        { label: 'Total', val: ds.total, color: '#FF9933' },
                                        { label: 'Resolved', val: ds.resolved, color: '#138808' },
                                        { label: 'SLA Risk', val: ds.slaRisk, color: '#dc2626' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} className="text-center px-3 py-1.5 rounded-lg"
                                            style={{ backgroundColor: color + '12' }}>
                                            <div className="text-base font-black" style={{ color }}>{val}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{label}</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3.5 flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search complaints..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30 transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    className="appearance-none py-2 pl-3 pr-6 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-sm font-semibold focus:outline-none text-slate-600 dark:text-slate-300"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="escalated">Escalated</option>
                                </select>
                            </div>
                            <span className="text-xs text-slate-400 ml-auto">{deptComplaints.length} results</span>
                        </div>

                        {/* Complaint list */}
                        {deptComplaints.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                    <Inbox className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No complaints found</p>
                                <p className="text-slate-400 text-xs mt-1">Try changing your filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {deptComplaints.map(c => {
                                    const now = new Date();
                                    const deadline = parseISO(c.sla_deadline);
                                    const isResolved = c.status === 'resolved';
                                    const refTime = isResolved && c.resolved_at ? parseISO(c.resolved_at) : now;
                                    const hoursLeft = differenceInHours(deadline, refTime);
                                    const isOverdue = !isResolved && hoursLeft < 0;
                                    const isRisk = !isResolved && hoursLeft < 24;
                                    const pColor = PRIORITY_COLOR[c.priority] || '#94a3b8';

                                    return (
                                        <Link
                                            key={c.id}
                                            to={`/complaint/${c.id}`}
                                            className={`group flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl border px-5 py-4 hover:shadow-md transition-all ${
                                                isOverdue ? 'border-red-200 bg-red-50/20' : 'border-slate-100 dark:border-slate-700 hover:border-[#FF9933]/30'
                                            }`}
                                        >
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: pColor + '15' }}>
                                                {isRisk
                                                    ? <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    : <Zap className="w-4 h-4" style={{ color: pColor }} />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-mono font-bold text-[#FF9933]">{c.complaint_number}</span>
                                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_COLOR[c.status] || 'bg-slate-50 text-slate-500'}`}>
                                                        {c.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                                        style={{ backgroundColor: pColor + '15', color: pColor }}>
                                                        {c.priority}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-800 dark:text-white text-sm truncate group-hover:text-[#FF9933] transition-colors capitalize">
                                                    {c.title.toLowerCase()}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-400">
                                                    <span>Ward {c.ward_number || 'N/A'}</span>
                                                    <span>{format(parseISO(c.created_at), 'dd MMM yyyy')}</span>
                                                </div>
                                            </div>

                                            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-700 shrink-0">
                                                <div className="text-right">
                                                    {isResolved ? (
                                                        <>
                                                            <div className={`text-sm font-black ${hoursLeft >= 0 ? 'text-[#138808]' : 'text-red-500'}`}>
                                                                {hoursLeft >= 0 ? `+${hoursLeft}h` : `−${Math.abs(hoursLeft)}h`}
                                                            </div>
                                                            <div className={`text-[9px] font-semibold uppercase tracking-wider ${hoursLeft >= 0 ? 'text-[#138808]' : 'text-red-500'}`}>
                                                                {hoursLeft >= 0 ? 'early' : 'late'}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className={`text-sm font-black ${isOverdue ? 'text-red-600' : isRisk ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                {isOverdue ? `−${Math.abs(hoursLeft)}h` : `${hoursLeft}h`}
                                                            </div>
                                                            <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">remaining</div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF993315', color: '#FF9933' }}>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* ── Raise Alert Modal ── */}
            <RaiseAlertModal
                isOpen={isAlertModalOpen}
                onClose={() => setIsAlertModalOpen(false)}
                onSuccess={handleAlertSuccess}
            />

            {/* ── Success Toast ── */}
            <AnimatePresence>
                {alertSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-[#138808] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
                    >
                        <CheckCircle2 size={20} />
                        <span className="font-bold">{alertSuccess}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MCDashboard;
