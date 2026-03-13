import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, ShieldCheck, CheckCircle2, Loader, AlertCircle } from 'lucide-react';

interface ComplaintData {
    id: string;
    complaint_number: string;
    title: string;
    description: string;
    status: string;
    address: string;
    category?: string;
    priority?: string;
    created_at: string;
    assigned_department_id?: string;
}

interface TimelineItem {
    status: string;
    date: string;
    relativeTime: string;
    note: string;
}

interface AIClassification {
    category: string;
    severity: string;
    department_name: string;
    reasoning: string;
    confidence_score?: number;
}

const ComplaintDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [complaint, setComplaint] = useState<ComplaintData | null>(null);
    const [aiData, setAiData] = useState<AIClassification | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Calculate relative time (e.g., "2 hours ago")
    const getRelativeTime = (dateString: string): string => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        const fetchComplaintDetail = async () => {
            try {
                if (!id) {
                    setError('Complaint ID not found');
                    return;
                }

                // Fetch complaint details
                const complaintRes = await fetch(`/api/complaints/${id}`);
                const complaintData = await complaintRes.json();

                if (!complaintRes.ok || !complaintData.success) {
                    throw new Error(complaintData.error || 'Failed to fetch complaint');
                }

                setComplaint(complaintData.complaint);

                // Fetch AI classification if available
                if (complaintData.complaint.ai_classification) {
                    setAiData(complaintData.complaint.ai_classification);
                }

                // Build timeline from status history
                const statusHistory = complaintData.complaint.status_history || [];
                const timelineItems: TimelineItem[] = statusHistory.map((item: any) => {
                    const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return {
                        status: item.new_status,
                        date: formattedDate,
                        relativeTime: getRelativeTime(item.created_at),
                        note: item.remarks || 'Status updated'
                    };
                });
                
                // If no timeline, create a default one from complaint creation
                if (timelineItems.length === 0) {
                    const formattedDate = new Date(complaintData.complaint.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    timelineItems.push({
                        status: complaintData.complaint.status,
                        date: formattedDate,
                        relativeTime: getRelativeTime(complaintData.complaint.created_at),
                        note: 'Complaint submitted'
                    });
                }

                setTimeline(timelineItems.reverse());
            } catch (err: any) {
                setError(err.message || 'Error loading complaint details');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaintDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
                <Loader className="animate-spin text-saffron-600" size={40} />
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="max-w-5xl mx-auto space-y-4">
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-saffron-600 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
                    <AlertCircle size={20} />
                    {error || 'Complaint not found'}
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-saffron-600 transition-colors font-medium">
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="text-sm font-mono font-bold text-saffron-600 tracking-tighter uppercase">{complaint.complaint_number}</div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white uppercase font-deva">{complaint.title}</h1>
                                <p className="text-slate-500 text-sm">Submitted on {formatDate(complaint.created_at)}</p>
                            </div>
                            <div className={cn(
                                "px-6 py-2 border rounded-lg text-sm font-bold capitalize",
                                complaint.status === 'resolved' ? 'bg-india-green-100 text-india-green-700 border-india-green-200' :
                                complaint.status === 'in_progress' || complaint.status === 'under_review' ? 'bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200' :
                                'bg-saffron-100 text-saffron-700 border-saffron-200'
                            )}>
                                {complaint.status.replace(/_/g, ' ')}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white">Description</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{complaint.description}</p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-8">
                            <div className="space-y-1">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Location</div>
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                                    <MapPin size={16} className="text-saffron-600" /> {complaint.address || 'Location pending'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Classification Card */}
                    {aiData ? (
                        <div className="bg-gradient-to-br from-india-green-50/50 to-navy-blue-50/50 dark:from-india-green-900/20 dark:to-navy-blue-900/20 p-8 rounded-lg border border-india-green-100 dark:border-india-green-800 shadow-xl shadow-india-green-100/20 dark:shadow-none space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-india-green-100 dark:text-india-green-900/40 -z-10">
                                <ShieldCheck size={120} />
                            </div>
                            
                            <div className="flex items-center gap-3 text-india-green-600 dark:text-india-green-400 font-bold">
                                <ShieldCheck /> AI Analysis Report
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Classifier Result</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white capitalize">{aiData.category.replace(/_/g, ' ')}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Severity Assessment</div>
                                        <div className="inline-block px-3 py-1 bg-saffron-100 text-saffron-700 border border-saffron-200 rounded-lg text-xs font-bold uppercase tracking-widest">{aiData.severity}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Assigned Department</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">{aiData.department_name}</div>
                                    </div>
                                    {aiData.confidence_score && (
                                        <div>
                                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Confidence Score</div>
                                            <div className="font-bold text-india-green-600">{(aiData.confidence_score * 100).toFixed(0)}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-white/80 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 italic">
                                " {aiData.reasoning} "
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 text-center">
                            AI analysis is being processed...
                        </div>
                    )}
                </div>

                {/* Right: Timeline & Media */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           <Clock size={18} /> Status Timeline
                        </h3>
                        
                        {timeline.length > 0 ? (
                            <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                                {timeline.map((t, i) => (
                                    <div key={i} className="relative pl-10 space-y-1">
                                        <div className={cn(
                                            "absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-800 flex-shrink-0 z-10",
                                            i === 0 ? "border-saffron-600 text-saffron-600" : "border-slate-200 text-slate-300"
                                        )}>
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">{t.status.replace(/_/g, ' ')}</div>
                                        <div className="text-xs text-slate-400 font-medium">{t.relativeTime}</div>
                                        <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg mt-2">{t.note}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-4">No timeline updates yet</div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-center">
                        <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400">
                             Media Item Proof
                        </div>
                        <p className="text-xs text-slate-500 italic">User uploaded evidence</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple cn utility for the detail page
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default ComplaintDetail;
