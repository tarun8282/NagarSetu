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
    resolved: { color: '#138808', bg: '#13880812', label: 'Resolved' },
    in_progress: { color: '#FF9933', bg: '#FF993312', label: 'In Progress' },
    under_review: { color: '#f59e0b', bg: '#f59e0b12', label: 'Under Review' },
    rejected: { color: '#dc2626', bg: '#dc262612', label: 'Rejected' },
    escalated: { color: '#7c3aed', bg: '#7c3aed12', label: 'Escalated' },
    pending: { color: '#94a3b8', bg: '#94a3b812', label: 'Pending' },
};

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
    critical: { color: '#dc2626', bg: '#dc262612' },
    high: { color: '#FF9933', bg: '#FF993312' },
    medium: { color: '#f59e0b', bg: '#f59e0b12' },
    low: { color: '#138808', bg: '#13880812' },
};

const statusMeta = (s: string) => STATUS_META[s] || { color: '#94a3b8', bg: '#94a3b812', label: s.replace(/_/g, ' ') };
const capitalize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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

                const timelineItems = (data.complaint.status_history || []).map((item: any) => ({
                    new_status: item.new_status,
                    old_status: item.old_status || null,
                    date: item.created_at ? format(parseISO(item.created_at), 'dd MMM yyyy, HH:mm') : 'Date Unknown',
                    rawDate: item.created_at || '',
                    note: item.remarks || `Status moved to ${capitalize(item.new_status)}`
                }));

                const submissionEvent = {
                    new_status: 'submitted',
                    old_status: null,
                    date: format(parseISO(data.complaint.created_at), 'dd MMM yyyy, HH:mm'),
                    rawDate: data.complaint.created_at,
                    note: 'Complaint registered and assigned to department'
                };

                const sortedTimeline = [submissionEvent, ...timelineItems].sort((a, b) =>
                    new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
                );

                setTimeline(sortedTimeline as any);
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
                                                <img src={m.public_url} alt={`Evidence ${i + 1}`}
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
                            incidentLat={complaint.latitude}
                            incidentLon={complaint.longitude}
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

/* ─── Distance Helper (Haversine Formula) ──────────────────── */
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in metres
};

/* ─── Camera Modal Component ─────────────────────────────── */
const CameraModal: React.FC<{
    onCapture: (file: File) => void;
    onClose: () => void;
}> = ({ onCapture, onClose }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = React.useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = React.useState('');

    React.useEffect(() => {
        const startCamera = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
            } catch (err) {
                setCameraError('Could not access camera. Please check permissions.');
            }
        };
        startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    onClose();
                }
            }, 'image/jpeg', 0.85);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                {cameraError ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white">
                        <AlertTriangle size={40} className="text-red-500 mb-4" />
                        <p className="font-bold">{cameraError}</p>
                        <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 rounded-xl font-bold">Close</button>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                            <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] text-white font-black uppercase tracking-widest border border-white/10">
                                Live View
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                                <AlertCircle size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="absolute bottom-6 inset-x-0 flex items-center justify-center">
                            <button
                                onClick={handleCapture}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-white group-hover:bg-slate-200 transition-colors" />
                            </button>
                        </div>
                    </>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Capture operational evidence at the site</p>
        </div>
    );
};

/* ─── Officer Action Panel ────────────────────────────────── */
const OfficerActionPanel: React.FC<{
    complaintId: string;
    currentStatus: string;
    onUpdate: () => void;
    incidentLat: number;
    incidentLon: number;
}> = ({
    complaintId, currentStatus, onUpdate, incidentLat, incidentLon
}) => {
    const { user } = useAuth();
    const [status, setStatus] = useState(currentStatus);
    const [remarks, setRemarks] = useState('');
    const [evidence, setEvidence] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Geolocation / Validation / Camera states
    const [geoLoading, setGeoLoading] = useState(false);
    const [officerLocation, setOfficerLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [distanceError, setDistanceError] = useState('');
    const [isWithinRange, setIsWithinRange] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const validateLocation = (lat: number, lon: number) => {
        setOfficerLocation({ lat, lon });
        if (incidentLat && incidentLon) {
            const dist = getDistance(lat, lon, incidentLat, incidentLon);
            if (dist > 100) {
                setDistanceError(`Location Mismatch: You are ${Math.round(dist)}m away. Move to the site.`);
                setIsWithinRange(false);
            } else {
                setDistanceError('');
                setIsWithinRange(true);
            }
        }
    };

    const handlePhotoCaptured = (file: File) => {
        setEvidence(file);
        setPreviewUrl(URL.createObjectURL(file));

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                validateLocation(pos.coords.latitude, pos.coords.longitude);
                setGeoLoading(false);
            },
            (err) => {
                setDistanceError('Geo-Validation Failed: GPS required for site evidence.');
                setIsWithinRange(false);
                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Safety check if evidence is provided but range is failing
        if (evidence && !isWithinRange) {
            alert("Submission Blocked: Action can only be verified within 100m of the complaint location.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('remarks', remarks);
            formData.append('changed_by', user?.id || '');

            if (evidence) {
                formData.append('proof', evidence);
                // Also append the coordinates to the remarks if they exist
                if (officerLocation) {
                    formData.append('verified_lat', officerLocation.lat.toString());
                    formData.append('verified_lon', officerLocation.lon.toString());
                }
            }

            const res = await fetch(`/api/complaints/${complaintId}/status`, {
                method: 'PATCH',
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update status');
            }

            setSuccess(true);
            setRemarks('');
            setEvidence(null);
            setOfficerLocation(null);

            setTimeout(() => {
                setSuccess(false);
                onUpdate();
            }, 1000);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Error updating status');
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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                <span>📷 SITE EVIDENCE</span>
                                {geoLoading && <div className="w-2 h-2 rounded-full bg-[#FF9933] animate-ping" title="Verifying Geo-location..." />}
                            </label>

                            {!evidence ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="w-full h-[88px] flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-[#FF9933] hover:border-[#FF9933]/50 transition-all"
                                >
                                    <Camera size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Open Camera to capture</span>
                                </button>
                            ) : (
                                <div className="relative h-[88px] rounded-2xl overflow-hidden border-2 border-[#138808]/30 group">
                                    <img src={previewUrl!} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setEvidence(null); setPreviewUrl(null); setShowCamera(true); }}
                                            className="p-2 bg-white rounded-full text-slate-800 shadow-xl"
                                        >
                                            <Camera size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setEvidence(null); setPreviewUrl(null); }}
                                            className="p-2 bg-white rounded-full text-red-500 shadow-xl"
                                        >
                                            <ArrowLeft size={14} className="rotate-45" />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#138808] text-white text-[8px] font-black rounded uppercase">
                                        Captured
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {showCamera && (
                        <CameraModal
                            onCapture={handlePhotoCaptured}
                            onClose={() => setShowCamera(false)}
                        />
                    )}

                    {/* Geolocation Feedback */}
                    {distanceError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 animate-in slide-in-from-top-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-red-700 leading-tight">
                                {distanceError}
                            </p>
                        </div>
                    )}

                    {officerLocation && isWithinRange && (
                        <div className="p-2.5 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#138808]" />
                            <p className="text-[10px] font-bold text-[#138808] uppercase tracking-wider">
                                ✅ Site Location Verified (within 100m)
                            </p>
                        </div>
                    )}

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
                    <button type="submit" disabled={loading || success || !isWithinRange || (!!evidence && geoLoading)}
                        className="w-full py-3 rounded-xl font-black text-sm text-white uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ backgroundColor: success ? '#138808' : '#FF9933' }}>
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying & Updating…</>
                            : success
                                ? <><CheckCircle2 size={15} /> Published Successfully!</>
                                : <><CheckCircle2 size={15} /> Confirm Site Action</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ComplaintDetail;