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
    AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO, differenceInHours } from 'date-fns';

interface Complaint {
    id: string;
    complaint_number: string;
    title: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    created_at: string;
    sla_deadline: string;
    address: string;
    ward_number: string;
}

const OfficerComplaints: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            // In a real app, RLS handles city/department isolation
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setComplaints(data || []);
        } catch (err) {
            console.error('Error fetching complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 c.complaint_number.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' ? true : 
                                 statusFilter === 'sla_risk' ? (
                                     c.status !== 'resolved' && 
                                     differenceInHours(parseISO(c.sla_deadline), new Date()) < 24
                                 ) : c.status === statusFilter;

            const matchesPriority = priorityFilter === 'all' ? true : 
                                   priorityFilter.split(',').includes(c.priority);

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [complaints, searchTerm, statusFilter, priorityFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-india-green-100 text-india-green-700 border-india-green-200';
            case 'in_progress':
            case 'under_review': return 'bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200';
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

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Link to="/officer/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-navy-blue transition-all font-bold group mb-2">
                        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase font-deva">Department Queue</h1>
                    <p className="text-slate-500 font-medium">Manage and resolve assigned civic complaints.</p>
                </div>

                <div className="flex items-center gap-2 bg-navy-blue text-white px-6 py-3 rounded-2xl shadow-lg">
                    <Inbox className="w-5 h-5 text-saffron" />
                    <div className="text-sm font-bold uppercase tracking-widest">
                        {filteredComplaints.length} Complaints in View
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="grid md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by ID or Title..." 
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-navy-blue transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="md:col-span-3 flex items-center gap-2">
                        <Filter className="text-slate-400" size={18} />
                        <select 
                            className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-navy-blue transition-all font-bold text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="under_review">Under Review</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="sla_risk">SLA Risk ( &lt;24h )</option>
                        </select>
                    </div>

                    <div className="md:col-span-3 flex items-center gap-2">
                        <ArrowUpDown className="text-slate-400" size={18} />
                        <select 
                            className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-navy-blue transition-all font-bold text-sm"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="all">All Priorities</option>
                            <option value="critical">Critical Only</option>
                            <option value="high,critical">High & Critical</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <button 
                        onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                        className="md:col-span-1 p-3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition-colors"
                        title="Clear Filters"
                    >
                        <AlertCircle size={20} />
                    </button>
                </div>
            </div>

            {/* Complaints List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader className="w-10 h-10 animate-spin text-saffron" />
                    <p className="font-deva font-medium animate-pulse">प्रतीक्षा करें... Fetching Queue</p>
                </div>
            ) : filteredComplaints.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase">No Complaints Found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters to see more results.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredComplaints.map(c => {
                        const now = new Date();
                        const deadline = parseISO(c.sla_deadline);
                        const hoursLeft = differenceInHours(deadline, now);
                        const isRisk = hoursLeft < 24 && c.status !== 'resolved';

                        return (
                            <Link 
                                key={c.id} 
                                to={`/complaint/${c.id}`} 
                                className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 hover:border-navy-blue transition-all shadow-sm hover:shadow-xl flex items-center gap-6"
                            >
                                {/* Left Icon/Status */}
                                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${isRisk ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {isRisk ? <AlertTriangle /> : <Inbox />}
                                    <div className="text-[8px] font-black uppercase mt-1">{isRisk ? 'Alert' : 'ID'}</div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono font-black text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded tracking-tighter uppercase whitespace-nowrap">
                                            {c.complaint_number}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(c.status)} whitespace-nowrap`}>
                                            {c.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getPriorityStyle(c.priority)} whitespace-nowrap`}>
                                            {c.priority}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase truncate font-deva group-hover:text-navy-blue transition-colors">
                                        {c.title}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin size={12} className="text-navy-blue" /> Ward {c.ward_number || '45'}</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {format(parseISO(c.created_at), 'dd MMM yyyy')}</span>
                                        <span className={`flex items-center gap-1 ${isRisk ? 'text-red-600' : 'text-slate-400'}`}>
                                            <Clock size={12} /> SLA: {format(deadline, 'dd MMM')}
                                        </span>
                                    </div>
                                </div>

                                {/* Right Action */}
                                <div className="hidden md:flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-700">
                                    <div className="text-right">
                                        <div className={`text-lg font-black ${hoursLeft < 0 ? 'text-red-600' : hoursLeft < 24 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                                            {hoursLeft < 0 ? 'BREACH' : `${hoursLeft}h`}
                                        </div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Remaining</div>
                                    </div>
                                    <div className="p-3 rounded-full bg-navy-blue-50 text-navy-blue group-hover:bg-navy-blue group-hover:text-white transition-all">
                                        <ChevronRight size={20} />
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
