import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    Clock, 
    ArrowLeft, 
    Inbox, 
    AlertTriangle, 
    Loader,
    ChevronRight,
    Calendar,
    ArrowUpDown,
    MapPin,
    X,
    Shield
} from 'lucide-react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { useAuth } from '../context/AuthContext';

interface Complaint {
    id: string;
    complaint_number: string;
    title: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    created_at: string;
    sla_deadline: string;
    resolved_at?: string;
    address: string;
    ward_number: string;
    complaint_media?: { public_url: string }[];
}

const OfficerComplaints: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
    const cityFilter = searchParams.get('city_id');

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            let url = `/api/complaints?`;
            
            if (cityFilter) {
                url += `city_id=${cityFilter}`;
            } else if (user?.role === 'state_admin' && user?.state_id) {
                url += `state_id=${user.state_id}`;
            } else if (user?.role === 'mc_admin' && user?.city_id) {
                url += `city_id=${user.city_id}`;
            } else if (user?.role === 'dept_officer') {
                if (user.department_id) url += `department_id=${user.department_id}`;
                else if (user.city_id) url += `city_id=${user.city_id}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                setComplaints(data.complaints || []);
            } else {
                console.error('Failed to fetch complaints:', data.error);
                setComplaints([]);
            }
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchComplaints(); }, [cityFilter, user?.id]);

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.complaint_number.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' ? true :
                statusFilter === 'sla_risk' ? (
                    c.status !== 'resolved' && differenceInHours(parseISO(c.sla_deadline), new Date()) < 24
                ) : c.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' ? true :
                priorityFilter.split(',').includes(c.priority);
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [complaints, searchTerm, statusFilter, priorityFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved':    return 'bg-emerald-50 text-emerald-700';
            case 'in_progress': return 'bg-amber-50 text-amber-700';
            case 'under_review':return 'bg-orange-50 text-orange-600';
            case 'escalated':   return 'bg-red-50 text-red-600';
            case 'rejected':    return 'bg-slate-100 text-slate-500';
            default:            return 'bg-orange-50 text-orange-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return '#dc2626';
            case 'high':     return '#FF9933';
            case 'medium':   return '#f59e0b';
            default:         return '#138808';
        }
    };

    const activeFilterCount = [
        statusFilter !== 'all',
        priorityFilter !== 'all',
        searchTerm !== '',
    ].filter(Boolean).length;

    return (
        <div className="space-y-5 pb-12 max-w-5xl mx-auto">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link to={user?.role === 'state_admin' ? '/state/dashboard' : (user?.role === 'mc_admin' ? '/admin/dashboard' : '/officer/dashboard')}
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#FF9933] text-xs font-bold mb-2 transition-colors group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Complaint Queue</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Manage and resolve assigned civic complaints</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ backgroundColor: '#FF993315', color: '#FF9933' }}>
                    <Inbox className="w-4 h-4" />
                    {filteredComplaints.length} in view
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by ID or title..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': '#FF9933' } as React.CSSProperties}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Status */}
                <div className="relative flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        className="appearance-none py-2 pl-3 pr-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 transition-all text-slate-600 dark:text-slate-300"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="under_review">Under Review</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="sla_risk">SLA Risk (&lt;24h)</option>
                    </select>
                </div>

                {/* Priority */}
                <div className="relative flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    <select
                        className="appearance-none py-2 pl-3 pr-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 transition-all text-slate-600 dark:text-slate-300"
                        value={priorityFilter}
                        onChange={e => setPriorityFilter(e.target.value)}
                    >
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical Only</option>
                        <option value="high,critical">High & Critical</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                    <button
                        onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-500 text-xs font-bold transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
                    </button>
                )}
            </div>

            {/* ── COMPLAINT LIST ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader className="w-8 h-8 animate-spin text-[#FF9933]" />
                    <p className="text-slate-400 text-sm animate-pulse">Loading complaints...</p>
                </div>
            ) : filteredComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                        <Inbox className="w-7 h-7 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700 dark:text-white mb-1">No Complaints Found</h3>
                    <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filteredComplaints.map(c => {
                        const now = new Date();
                        const deadline = parseISO(c.sla_deadline);
                        const hoursLeft = differenceInHours(deadline, now);
                        const isRisk = hoursLeft < 24 && c.status !== 'resolved';
                        const priorityColor = getPriorityColor(c.priority);
                        
                        const isResolved = c.status === 'resolved';
                        const resolvedTime = isResolved && c.resolved_at ? parseISO(c.resolved_at) : now;
                        const actualHoursLeft = differenceInHours(deadline, resolvedTime);
                        const isResolvedEarly = isResolved && actualHoursLeft >= 0;

                        return (
                            <Link key={c.id} to={`/complaint/${c.id}`}
                                className={`group flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl border px-5 py-4 hover:shadow-md transition-all ${
                                    isRisk ? 'border-red-200 bg-red-50/20' : 'border-slate-100 dark:border-slate-700 hover:border-[#FF9933]/30'
                                }`}>

                                {/* Image or Priority indicator */}
                                {c.complaint_media && c.complaint_media.length > 0 ? (
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img src={c.complaint_media[0].public_url} alt="Evidence" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: priorityColor + '15' }}>
                                        {isRisk
                                            ? <AlertTriangle className="w-5 h-5 text-red-500" />
                                            : <Shield className="w-5 h-5" style={{ color: priorityColor }} />
                                        }
                                    </div>
                                )}

                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-mono font-bold text-[#FF9933]">
                                            {c.complaint_number}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getStatusStyle(c.status)}`}>
                                            {c.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                            style={{ backgroundColor: priorityColor + '15', color: priorityColor }}>
                                            {c.priority}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate group-hover:text-[#FF9933] transition-colors capitalize">
                                        {c.title.toLowerCase()}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Ward {c.ward_number || 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {format(parseISO(c.created_at), 'dd MMM yyyy')}
                                        </span>
                                        <span className={`flex items-center gap-1 ${isRisk ? 'text-red-500 font-semibold' : ''}`}>
                                            <Clock className="w-3 h-3" /> SLA: {format(deadline, 'dd MMM')}
                                        </span>
                                    </div>
                                </div>

                                {/* SLA time + arrow */}
                                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-700 shrink-0">
                                    <div className="text-right">
                                        {isResolved ? (
                                            <>
                                                <div className={`text-base font-black ${isResolvedEarly ? 'text-[#138808]' : 'text-red-500'}`}>
                                                    {isResolvedEarly ? `+${actualHoursLeft}h` : `−${Math.abs(actualHoursLeft)}h`}
                                                </div>
                                                <div className={`text-[9px] font-semibold uppercase tracking-widest ${isResolvedEarly ? 'text-[#138808]' : 'text-red-500'}`}>
                                                    {isResolvedEarly ? 'early' : 'late'}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`text-base font-black ${hoursLeft < 0 ? 'text-red-600' : hoursLeft < 24 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {hoursLeft < 0 ? `−${Math.abs(hoursLeft)}h` : `${hoursLeft}h`}
                                                </div>
                                                <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">remaining</div>
                                            </>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                        style={{ backgroundColor: '#FF993315', color: '#FF9933' }}>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OfficerComplaints;
