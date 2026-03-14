import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, Clock, MapPin, ShieldCheck, CheckCircle2,
    AlertCircle, Navigation, AlertTriangle, Eye,
    Activity, ArrowRight as ArrowRightIcon, Camera, Image,
    FileText, Zap, Tag
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, differenceInHours } from 'date-fns';

// Fix Leaflet's broken default icon paths in Vite builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
    resolved_at?: string;
    ward_number: string;
    media: ComplaintMedia[];
    ai_classification?: any;
    status_history?: any[];
}

interface TimelineItem {
    new_status: string;
    old_status: string | null;
    date: string;
    note: string;
}

/* ─── helpers ─────────────────────────────────────────────── */
const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
    resolved:     { color: '#138808', bg: '#13880812', label: 'Resolved' },
    in_progress:  { color: '#FF9933', bg: '#FF993312', label: 'In Progress' },
    under_review: { color: '#f59e0b', bg: '#f59e0b12', label: 'Under Review' },
    rejected:     { color: '#dc2626', bg: '#dc262612', label: 'Rejected' },
    escalated:    { color: '#7c3aed', bg: '#7c3aed12', label: 'Escalated' },
    pending:      { color: '#94a3b8', bg: '#94a3b812', label: 'Pending' },
};

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
    critical: { color: '#dc2626', bg: '#dc262612' },
    high:     { color: '#FF9933', bg: '#FF993312' },
    medium:   { color: '#f59e0b', bg: '#f59e0b12' },
    low:      { color: '#138808', bg: '#13880812' },
};

const statusMeta = (s: string) => STATUS_META[s] || { color: '#94a3b8', bg: '#94a3b812', label: s.replace(/_/g,' ') };
const capitalize = (s: string) => s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());

/* ─── Main Component ──────────────────────────────────────── */
const ComplaintDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [complaint, setComplaint] = useState<ComplaintData | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const dashboardLink = user?.role === 'dept_officer' ? '/officer/dashboard' : '/dashboard';

    useEffect(() => {
        const fetchComplaintDetail = async () => {
            try {
                if (!id) throw new Error('Complaint ID not found');
                const response = await fetch(`/api/complaints/${id}`);
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch complaint');

                setComplaint(data.complaint);

                const history: any[] = data.complaint.status_history || [];
                const timelineItems: TimelineItem[] = history.map((item: any) => ({
                    new_status: item.new_status,
                    old_status: item.old_status || null,
                    date: format(parseISO(item.created_at), 'dd MMM yyyy, HH:mm'),
                    note: item.remarks || 'Status updated'
                }));

                // Always include the initial submission as the first event in history
                const submissionEvent: TimelineItem = {
                    new_status: 'submitted',
                    old_status: null,
                    date: format(parseISO(data.complaint.created_at), 'dd MMM yyyy, HH:mm'),
                    note: 'Complaint submitted and assigned'
                };

                const fullTimeline = [submissionEvent, ...timelineItems];

                // If complaint is resolved, reverse will put resolved at top, submitted at bottom
                setTimeline(fullTimeline.reverse());
            } catch (err: any) {
                setError(err.message || 'Error loading details');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaintDetail();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-[#FF9933]/20 border-t-[#FF9933] animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading complaint details…</p>
        </div>
    );

    if (error || !complaint) return (
        <div className="max-w-lg mx-auto p-8 text-center mt-20">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Complaint not found</h2>
            <p className="text-slate-500 mb-6 text-sm">{error}</p>
            <Link to={dashboardLink} className="inline-flex items-center gap-2 text-[#FF9933] font-bold text-sm hover:gap-3 transition-all">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
        </div>
    );

    const now = new Date();
    const isResolved = complaint.status === 'resolved';
    const referenceTime = isResolved && complaint.resolved_at ? parseISO(complaint.resolved_at) : now;
    const deadline = parseISO(complaint.sla_deadline);
    const hoursLeft = differenceInHours(deadline, referenceTime);
    const isOverdue = hoursLeft < 0;
    const isResolvedEarly = isResolved && !isOverdue;

    const sm = statusMeta(complaint.status);
    const pm = PRIORITY_META[complaint.priority || 'medium'] || PRIORITY_META.medium;
    const evidenceMedia = complaint.media?.filter(m => !m.is_resolution_proof) || [];
    const proofMedia = complaint.media?.filter(m => m.is_resolution_proof) || [];

    return (
        <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500">

            {/* ── Top Nav ── */}
            <div className="flex items-center justify-between py-4 mb-2">
                <Link to={dashboardLink}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-[#FF9933] transition-all font-semibold text-sm group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
                </Link>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hidden sm:block">
                    Case File · {complaint.complaint_number}
                </span>
            </div>

            {/* ── HERO HEADER ── */}
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #e67300 100%)' }}>
                <div className="p-6 md:p-8 relative">
                    {/* Watermark */}
                    <div className="absolute right-6 top-6 opacity-10">
                        <ShieldCheck size={100} className="text-white" />
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-xs font-black font-mono bg-white/20 text-white px-2.5 py-1 rounded-lg">
                            {complaint.complaint_number}
                        </span>
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg text-white"
                            style={{ backgroundColor: sm.color }}>
                            {sm.label}
                        </span>
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg"
                            style={{ color: pm.color, backgroundColor: 'rgba(255,255,255,0.25)' }}>
                            {capitalize(complaint.priority || 'medium')} Priority
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-5 uppercase">
                        {complaint.title}
                    </h1>

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Ward', value: `Ward ${complaint.ward_number || 'N/A'}` },
                            { label: 'Category', value: capitalize(complaint.category || 'Civic Issue') },
                            { label: 'Filed On', value: format(parseISO(complaint.created_at), 'dd MMM yyyy') },
                            { label: 'SLA', value: isResolved ? (isOverdue ? 'RESOLVED LATE' : 'RESOLVED EARLY') : (isOverdue ? 'BREACHED' : `${hoursLeft}h left`), urgent: isOverdue },
                        ].map(({ label, value, urgent }) => (
                            <div key={label} className="bg-white/15 rounded-xl px-3 py-2.5">
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-0.5">{label}</p>
                                <p className={`text-sm font-black text-white ${urgent ? 'text-red-200' : ''}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SLA progress bar */}
                {!isResolved && (
                    <div className="h-1.5 bg-white/20">
                        <div className={`h-full transition-all duration-1000 ${isOverdue ? 'bg-red-400' : 'bg-white/70'}`}
                            style={{ width: `${Math.max(0, Math.min(100, (hoursLeft / 48) * 100))}%` }} />
                    </div>
                )}
                {isResolved && (
                    <div className="h-1.5 bg-white/20">
                        <div className={`h-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : 'bg-[#138808]'}`}
                            style={{ width: '100%' }} />
                    </div>
                )}
            </div>

            {/* ── MAIN GRID ── */}
            <div className="grid lg:grid-cols-12 gap-5">

                {/* ── LEFT (8/12) ── */}
                <div className="lg:col-span-8 space-y-5">

                    {/* Description */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                            <FileText size={13} className="text-[#FF9933]" /> Case Description
                        </h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                            {complaint.description}
                        </p>
                    </div>

                    {/* Evidence Gallery */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                <Image size={13} className="text-[#FF9933]" /> Evidence Gallery
                            </h2>
                            {evidenceMedia.length > 0 && (
                                <span className="text-xs font-black px-2 py-0.5 rounded-md"
                                    style={{ color: '#FF9933', backgroundColor: '#FF993312' }}>
                                    {evidenceMedia.length} photo{evidenceMedia.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {evidenceMedia.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {evidenceMedia.map((m, i) => (
                                    <div key={i} className="aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 group relative bg-slate-50">
                                        {m.is_video ? (
                                            <video src={m.public_url} className="w-full h-full object-cover" controls />
                                        ) : (
                                            <div
                                                className="w-full h-full cursor-pointer relative block"
                                                onClick={(e) => { e.preventDefault(); setFullscreenImage(m.public_url); }}
                                            >
                                                <img src={m.public_url} alt={`Evidence ${i+1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-0" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none z-10">
                                                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-700 text-center">
                                <Camera size={24} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-sm text-slate-400 font-medium">No evidence photos attached yet</p>
                                <p className="text-xs text-slate-300 mt-0.5">Officers can add evidence via the action panel below</p>
                            </div>
                        )}

                        {/* Resolution proof */}
                        {proofMedia.length > 0 && (
                            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#138808' }}>
                                    <CheckCircle2 size={12} /> Resolution Proof
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {proofMedia.map((m, i) => (
                                        <div key={i} className="aspect-video rounded-xl overflow-hidden border-2 relative cursor-pointer group"
                                            style={{ borderColor: '#138808' + '30' }}
                                            onClick={(e) => { e.preventDefault(); setFullscreenImage(m.public_url); }}
                                        >
                                            <img src={m.public_url} alt="Resolution" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-0" />
                                            <div className="absolute bottom-0 inset-x-0 py-1 text-center text-[9px] font-black text-white uppercase tracking-wider z-20"
                                                style={{ backgroundColor: '#138808' }}>
                                                Verified Resolution
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center z-10 pointer-events-none">
                                                <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Officer Action Panel */}
                    {user?.role === 'dept_officer' && (
                        <OfficerActionPanel
                            complaintId={complaint.id}
                            currentStatus={complaint.status}
                            onUpdate={() => window.location.reload()}
                        />
                    )}

                    {/* Location & Map */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                            <MapPin size={13} className="text-[#FF9933]" /> Location
                        </h2>
                        <div className="grid md:grid-cols-5 gap-4">
                            <div className="md:col-span-2 space-y-3">
                                <p className="text-slate-800 dark:text-white font-bold text-sm leading-snug">
                                    {complaint.address || 'Address not available'}
                                </p>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <Navigation size={14} className="text-[#FF9933] shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">GPS</p>
                                        <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                            {complaint.latitude?.toFixed(5) ?? 'N/A'}, {complaint.longitude?.toFixed(5) ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-3 h-52 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50">
                                {complaint.latitude && complaint.longitude ? (
                                    <MapContainer
                                        center={[complaint.latitude, complaint.longitude]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                        zoomControl={false}
                                        attributionControl={false}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[complaint.latitude, complaint.longitude]}>
                                            <Popup>{complaint.address || complaint.complaint_number}</Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <MapPin size={24} />
                                        <span className="text-sm">Location unavailable</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT (4/12) ── */}
                <div className="lg:col-span-4 space-y-5">

                    {/* SLA Card */}
                    {isResolved ? (
                        <div className={`rounded-2xl p-5 border ${isResolvedEarly ? 'bg-india-green-50 dark:bg-india-green-950/20 border-india-green-200 dark:border-india-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 ${isResolvedEarly ? 'text-india-green-600' : 'text-red-500'}`}>
                                <ShieldCheck size={12} /> {isResolvedEarly ? 'SLA Met & Resolved' : 'Resolved Late'}
                            </div>
                            <div className={`text-3xl font-black mb-1 ${isResolvedEarly ? 'text-india-green-700 dark:text-india-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {isResolvedEarly ? 'Completed Early' : 'SLA Breached'}
                            </div>
                            <p className="text-xs text-slate-500 mb-3">
                                {isResolvedEarly ? `Saved ${hoursLeft} hours of SLA time` : `Missed SLA by ${Math.abs(hoursLeft)} hours`}
                            </p>
                            <div className={`h-2 rounded-full overflow-hidden ${isResolvedEarly ? 'bg-india-green-200' : 'bg-red-200'}`}>
                                <div className={`h-full rounded-full ${isResolvedEarly ? 'bg-india-green-600' : 'bg-red-600'}`} style={{ width: '100%' }} />
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-2xl p-5 border ${isOverdue
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}`}>
                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                                <AlertTriangle size={12} /> SLA Deadline
                            </div>
                            <div className={`text-3xl font-black mb-1 ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                {isOverdue ? 'BREACHED' : `${hoursLeft}h left`}
                            </div>
                            <p className="text-xs text-slate-500 mb-3">
                                Due: {format(deadline, 'dd MMM yyyy, h:mm a')}
                            </p>
                            <div className={`h-2 rounded-full ${isOverdue ? 'bg-red-200' : 'bg-amber-200'} overflow-hidden`}>
                                <div className={`h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-600' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, (hoursLeft / 48) * 100))}%` }} />
                            </div>
                        </div>
                    )}

                    {/* AI Report */}
                    {complaint.ai_classification && (
                        <div className="rounded-2xl p-5 text-white relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                            <ShieldCheck className="absolute -right-3 -bottom-3 opacity-5" size={100} />
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck size={14} className="text-[#FF9933]" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/70">AI Assessment</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-white/10 rounded-xl p-3">
                                    <p className="text-[9px] font-bold text-white/50 uppercase mb-1">Confidence</p>
                                    <p className="text-xl font-black" style={{ color: '#138808' }}>
                                        {(complaint.ai_classification.confidence_score * 100).toFixed(0)}%
                                    </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3">
                                    <p className="text-[9px] font-bold text-white/50 uppercase mb-1">Severity</p>
                                    <p className="text-xl font-black text-[#FF9933] capitalize">
                                        {complaint.ai_classification.severity}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Tag size={10} className="text-white/50" />
                                    <p className="text-[9px] font-bold text-white/50 uppercase">AI Reasoning</p>
                                </div>
                                <p className="text-xs text-white/70 leading-relaxed italic">
                                    "{complaint.ai_classification.reasoning}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                            <Clock size={13} className="text-[#FF9933]" /> Case Timeline
                        </h3>

                        <div className="relative">
                            <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-700" />
                            <div className="space-y-3">
                                {timeline.map((t, i) => {
                                    const meta = statusMeta(t.new_status);
                                    const isLatest = i === 0;
                                    return (
                                        <div key={i} className="relative pl-9">
                                            {/* dot */}
                                            <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-800 z-10"
                                                style={{
                                                    borderColor: isLatest ? meta.color : '#e2e8f0',
                                                    boxShadow: isLatest ? `0 0 0 3px ${meta.color}22` : 'none'
                                                }}>
                                                <CheckCircle2 size={12} style={{ color: isLatest ? meta.color : '#cbd5e1' }} />
                                            </div>

                                            <div className={`rounded-xl p-3 ${isLatest ? 'border' : ''}`}
                                                style={isLatest ? { borderColor: meta.color + '30', backgroundColor: meta.bg } : {}}>

                                                {/* transition badges */}
                                                <div className="flex items-center gap-1 flex-wrap mb-1.5">
                                                    {t.old_status && (
                                                        <>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                                                {capitalize(t.old_status)}
                                                            </span>
                                                            <ArrowRightIcon size={8} className="text-slate-300 shrink-0" />
                                                        </>
                                                    )}
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white"
                                                        style={{ backgroundColor: meta.color }}>
                                                        {capitalize(t.new_status)}
                                                    </span>
                                                    {t.new_status === 'resolved' && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded ml-2"
                                                            style={{
                                                                color: isResolvedEarly ? '#138808' : '#ef4444',
                                                                backgroundColor: isResolvedEarly ? '#13880815' : '#ef444415'
                                                            }}>
                                                            {isResolvedEarly ? `✓ Completed ${hoursLeft}h Early` : `⚠ Missed SLA by ${Math.abs(hoursLeft)}h`}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.note}</p>
                                                <p className="text-[9px] text-slate-400 mt-1 font-medium">{t.date}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                            <Zap size={13} className="text-[#FF9933]" /> Case Facts
                        </h3>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Status', value: sm.label, color: sm.color, bg: sm.bg },
                                { label: 'Priority', value: capitalize(complaint.priority || 'medium'), color: pm.color, bg: pm.bg },
                                { label: 'Category', value: capitalize(complaint.category || 'Civic Issue'), color: '#FF9933', bg: '#FF993312' },
                                { label: 'Evidence', value: `${evidenceMedia.length} photo${evidenceMedia.length !== 1 ? 's' : ''}`, color: '#138808', bg: '#13880812' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">{label}</span>
                                    <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ color, backgroundColor: bg }}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Photo Modal */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setFullscreenImage(null)}
                >
                    <div className="relative max-w-5xl max-h-screen w-full flex items-center justify-center">
                        <img
                            src={fullscreenImage}
                            alt="Fullscreen evidence"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
                            onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Officer Action Panel ────────────────────────────────── */
const OfficerActionPanel: React.FC<{ complaintId: string; currentStatus: string; onUpdate: () => void }> = ({
    complaintId, currentStatus, onUpdate
}) => {
    const { user } = useAuth();
    const [status, setStatus] = useState(currentStatus);
    const [remarks, setRemarks] = useState('');
    const [evidence, setEvidence] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('remarks', remarks);
            formData.append('changed_by', user?.id || '');

            const res = await fetch(`/api/complaints/${complaintId}/status`, { method: 'PATCH', body: formData });
            if (!res.ok) throw new Error('Failed to update status');

            if (evidence) {
                const evForm = new FormData();
                evForm.append('evidence', evidence);
                evForm.append('uploaded_by', user?.id || '');
                const evRes = await fetch(`/api/complaints/${complaintId}/evidence`, { method: 'POST', body: evForm });

                if (!evRes.ok) {
                    const errText = await evRes.text();
                    throw new Error(`Failed to upload evidence photo: ${errText}`);
                }
            }

            setSuccess(true);
            setRemarks('');
            setEvidence(null);
            setTimeout(() => { setSuccess(false); onUpdate(); }, 1500);
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#FF993330' }}>
            {/* Panel header */}
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #FF9933, #e67300)' }}>
                <div className="flex items-center gap-2 text-white">
                    <Activity size={16} />
                    <span className="font-black text-sm uppercase tracking-wide">Take Operational Action</span>
                </div>
                <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    Officer
                </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Status + Evidence row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30">
                                <option value="under_review">Under Review</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                                <option value="escalated">Escalate</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                📷 Add Evidence Photo
                            </label>
                            <input type="file" accept="image/*"
                                onChange={e => setEvidence(e.target.files?.[0] || null)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#FF9933] file:text-white hover:file:bg-[#e67300]"
                            />
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Remarks <span className="text-slate-300 normal-case font-normal">(visible to citizen)</span>
                        </label>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                            placeholder="Describe the action taken or reason for the status change…"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30 h-20 resize-none"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading || success}
                        className="w-full py-3 rounded-xl font-black text-sm text-white uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ backgroundColor: success ? '#138808' : '#FF9933' }}>
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                            : success
                                ? <><CheckCircle2 size={15} /> Updated Successfully!</>
                                : <><CheckCircle2 size={15} /> Confirm &amp; Publish Update</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ComplaintDetail;