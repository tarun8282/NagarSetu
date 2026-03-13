import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    Clock, 
    MapPin, 
    ShieldCheck, 
    CheckCircle2, 
    Loader, 
    AlertCircle, 
    Calendar, 
    Navigation, 
    Layers,
    AlertTriangle,
    Eye,
    Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, differenceInHours } from 'date-fns';

interface ComplaintMedia {
    id: string;
    public_url: string;
    is_video: boolean;
    is_resolution_proof: boolean;
}

interface ComplaintData {
    id: string;
    complaint_number: string;
    title: string;
    description: string;
    status: string;
    address: string;
    latitude: number;
    longitude: number;
    category?: string;
    priority?: string;
    created_at: string;
    sla_deadline: string;
    ward_number: string;
    media: ComplaintMedia[];
    ai_classification?: any;
    status_history?: any[];
}

interface TimelineItem {
    status: string;
    date: string;
    relativeTime: string;
    note: string;
}

const ComplaintDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [complaint, setComplaint] = useState<ComplaintData | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const dashboardLink = user?.role === 'dept_officer' ? '/officer/dashboard' : '/dashboard';

    useEffect(() => {
        const fetchComplaintDetail = async () => {
            try {
                if (!id) throw new Error('Complaint ID not found');

                const response = await fetch(`/api/complaints/${id}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to fetch complaint');
                }

                setComplaint(data.complaint);

                // Build timeline
                const history = data.complaint.status_history || [];
                const timelineItems = history.map((item: any) => ({
                    status: item.new_status,
                    date: format(parseISO(item.created_at), 'dd MMM yyyy, HH:mm'),
                    relativeTime: format(parseISO(item.created_at), 'p'),
                    note: item.remarks || 'Status updated'
                }));
                
                if (timelineItems.length === 0) {
                    timelineItems.push({
                        status: data.complaint.status,
                        date: format(parseISO(data.complaint.created_at), 'dd MMM yyyy, HH:mm'),
                        relativeTime: 'Submission',
                        note: 'Complaint submitted'
                    });
                }

                setTimeline(timelineItems.reverse());
            } catch (err: any) {
                setError(err.message || 'Error loading details');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaintDetail();
    }, [id]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-india-green-100 text-india-green-700 border-india-green-200';
            case 'in_progress':
            case 'under_review': return 'bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200';
            default: return 'bg-saffron-100 text-saffron-700 border-saffron-200';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader className="w-12 h-12 animate-spin text-saffron" />
            <p className="text-slate-500 font-medium font-deva animate-pulse">Fetching Complaint Data...</p>
        </div>
    );

    if (error || !complaint) return (
        <div className="max-w-4xl mx-auto p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Issue Found</h2>
            <p className="text-slate-600 mb-6">{error || 'Complaint not found'}</p>
            <Link to={dashboardLink} className="text-navy-blue font-bold flex items-center justify-center gap-2">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>
        </div>
    );

    const now = new Date();
    const deadline = parseISO(complaint.sla_deadline);
    const hoursLeft = differenceInHours(deadline, now);
    const isOverdue = hoursLeft < 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <Link to={dashboardLink} className="flex items-center gap-2 text-slate-500 hover:text-navy-blue transition-all font-bold group">
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Dashboard
                </Link>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    NagarSetu Case File • {complaint.complaint_number}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Core Information */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-slate-50 dark:text-slate-900 -z-0">
                            <Layers size={150} />
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-black text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                                            {complaint.complaint_number}
                                        </span>
                                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(complaint.status)}`}>
                                            {complaint.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase font-deva leading-tight pt-2">
                                        {complaint.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</div>
                                    <div className="text-sm font-black text-saffron uppercase">{complaint.priority || 'Medium'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ward</div>
                                    <div className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">Ward {complaint.ward_number || '45'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">City</div>
                                    <div className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">Mumbai</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</div>
                                    <div className="text-sm font-black text-navy-blue uppercase">{complaint.category?.replace(/_/g, ' ') || 'Civic Issue'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Description & Media */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
                        <section className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Eye size={14} className="text-navy-blue" /> Case Description
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                                {complaint.description}
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Calendar size={14} className="text-navy-blue" /> Evidence Gallery
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {complaint.media?.filter(m => !m.is_resolution_proof).length > 0 ? (
                                    complaint.media.filter(m => !m.is_resolution_proof).map((m, i) => (
                                        <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm group relative">
                                            {m.is_video ? (
                                                <video src={m.public_url} className="w-full h-full object-cover" controls />
                                            ) : (
                                                <img src={m.public_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 font-medium">
                                        No visual evidence attached to this case.
                                    </div>
                                )}
                            </div>
                        </section>

                        {complaint.media?.filter(m => m.is_resolution_proof).length > 0 && (
                            <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="text-xs font-black text-india-green-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Resolution Proof
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {complaint.media.filter(m => m.is_resolution_proof).map((m, i) => (
                                        <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-india-green-100 shadow-md group relative">
                                            <img src={m.public_url} alt="Resolution" className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-india-green-600/90 text-white text-[8px] font-black uppercase tracking-widest text-center py-1">Verified Resolution</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Officer Action Panel */}
                    {user?.role === 'dept_officer' && (
                        <OfficerActionPanel complaintId={complaint.id} currentStatus={complaint.status} onUpdate={() => window.location.reload()} />
                    )}

                    {/* Location & GPS */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MapPin size={14} className="text-navy-blue" /> Precise Location
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-slate-900 dark:text-white font-bold text-xl leading-snug">
                                        {complaint.address || 'Address information not available'}
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="bg-navy-blue-50 dark:bg-navy-blue-900/40 p-3 rounded-2xl border border-navy-blue-100 dark:border-navy-blue-800 flex items-center gap-3">
                                            <Navigation className="text-navy-blue" size={20} />
                                            <div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase">GPS Lat / Long</div>
                                                <div className="text-xs font-mono font-bold text-navy-blue-700 dark:text-navy-blue-300">
                                                    {complaint.latitude?.toFixed(6) || 'N/A'}, {complaint.longitude?.toFixed(6) || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 font-medium italic">
                                Map Component Placeholder
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Operational & Timelines */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* SLA Monitor */}
                    <div className={`p-8 rounded-[2rem] border shadow-xl space-y-4 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-slate-500">
                            <AlertTriangle className={isOverdue ? 'text-red-600' : 'text-amber-600'} /> SLA Deadline Monitor
                        </div>
                        <div className="space-y-1">
                            <div className={`text-3xl font-black ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
                                {isOverdue ? 'SLA BREACHED' : `${hoursLeft}h Remaining`}
                            </div>
                            <div className="text-xs text-slate-500 font-bold">
                                Deadline: {format(deadline, 'PPPP p')}
                            </div>
                        </div>
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${isOverdue ? 'bg-red-600' : 'bg-amber-600'}`}
                                style={{ width: `${Math.max(0, Math.min(100, (hoursLeft / 48) * 100))}%` }}
                            />
                        </div>
                    </div>

                    {/* AI Assessment */}
                    {complaint.ai_classification && (
                        <div className="bg-navy-blue text-white p-8 rounded-[2rem] shadow-2xl space-y-6 relative overflow-hidden">
                            <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                            <h3 className="font-bold text-lg flex items-center gap-2 border-b border-white/10 pb-4">
                                <ShieldCheck className="text-saffron" /> AI Intelligence Report
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-sm leading-relaxed italic">
                                    "{complaint.ai_classification.reasoning}"
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-bold opacity-50 uppercase mb-1">AI Confidence</div>
                                        <div className="text-xl font-black text-india-green-400">
                                            {(complaint.ai_classification.confidence_score * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-bold opacity-50 uppercase mb-1">AI Severity</div>
                                        <div className="text-xl font-black text-saffron">
                                            {complaint.ai_classification.severity}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                           <Clock size={14} className="text-navy-blue" /> Case Progress Timeline
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {timeline.map((t, i) => (
                                <div key={i} className="relative pl-10 space-y-1">
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 bg-white ${i === 0 ? 'border-saffron text-saffron shadow-lg' : 'border-slate-50 text-slate-300'}`}>
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t.status.replace(/_/g, ' ')}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{t.date}</div>
                                    <div className="text-xs text-slate-500 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl mt-2 line-clamp-2">
                                        {t.note}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const OfficerActionPanel: React.FC<{ complaintId: string, currentStatus: string, onUpdate: () => void }> = ({ complaintId, currentStatus, onUpdate }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState(currentStatus);
    const [remarks, setRemarks] = useState('');
    const [proof, setProof] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('remarks', remarks);
            formData.append('changed_by', user?.id || '');
            if (proof) formData.append('proof', proof);

            const res = await fetch(`/api/complaints/${complaintId}/status`, {
                method: 'PATCH',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to update status');
            onUpdate();
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-4 border-navy-blue-50 dark:border-navy-blue-900 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-navy-blue" /> Take Operational Action
                </h2>
                <span className="text-[10px] font-black text-navy-blue bg-navy-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Officer Command</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Case Status Update</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-navy-blue/10 transition-all"
                        >
                            <option value="under_review">Under Review</option>
                            <option value="in_progress">Mark: In Progress</option>
                            <option value="resolved">Mark: Case Resolved</option>
                            <option value="rejected">Mark: Rejected</option>
                            <option value="escalated">Escalate Case</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Upload Proof (Opt for Resolved)</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setProof(e.target.files?.[0] || null)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-6 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-navy-blue file:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Case Remarks (Visible to Citizen)</label>
                    <textarea 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Detail the actions taken or reason for status change..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-navy-blue/10 transition-all h-24"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-5 bg-navy-blue text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-navy-blue/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm & Publish Update</>}
                </button>
            </form>
        </div>
    );
};

export default ComplaintDetail;

