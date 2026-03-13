import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ComplaintDetail: React.FC = () => {

    // Mock data for development
    const complaint = {
        number: 'MH-MUM-2024-0342',
        date: 'March 12, 2024 at 10:45 AM',
        status: 'in_progress',
        title: 'Dangerous Pothole on Linking Road near Starbucks',
        description: 'There is a very deep pothole right in the middle of the road. Multiple scooters have almost slipped. It is especially dangerous at night as the streetlights are dim.',
        address: 'Linking Road, Khar West, Mumbai, Maharashtra 400052',
        category: 'road_pothole',
        severity: 'high',
        department: 'BMC Roads Department',
        helpline: '1916',
        email: 'roads@bmc.gov.in',
        reasoning: 'The issue involves a deep hole on a high-traffic road, posing immediate safety risks to motorists.',
        timeline: [
            { status: 'resolved', date: 'Just now', note: 'Issue fixed. Bitumen filling completed.', show: false },
            { status: 'in_progress', date: '2 hours ago', note: 'Team dispatched to site.', show: true },
            { status: 'under_review', date: '3 hours ago', note: 'AI classification complete. Assigned to Roads Dept.', show: true },
            { status: 'submitted', date: '4 hours ago', note: 'Complaint received with media proof.', show: true },
        ]
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
                                <div className="text-sm font-mono font-bold text-saffron-600 tracking-tighter uppercase">{complaint.number}</div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white uppercase font-deva">{complaint.title}</h1>
                                <p className="text-slate-500 text-sm">Submitted on {complaint.date}</p>
                            </div>
                            <div className="px-6 py-2 bg-navy-blue-100 text-navy-blue-700 border border-navy-blue-200 rounded-lg text-sm font-bold capitalize">
                                {complaint.status.replace('_', ' ')}
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
                                    <MapPin size={16} className="text-saffron-600" /> {complaint.address}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Classification Card */}
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
                                    <div className="text-lg font-bold text-slate-900 dark:text-white capitalize">{complaint.category.replace('_', ' ')}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Severity Assessment</div>
                                    <div className="inline-block px-3 py-1 bg-saffron-100 text-saffron-700 border border-saffron-200 rounded-lg text-xs font-bold uppercase tracking-widest">{complaint.severity}</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Assigned Department</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">{complaint.department}</div>
                                </div>
                                <div className="flex gap-4">
                                  <div>
                                     <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Helpline</div>
                                     <div className="font-bold text-india-green-600">{complaint.helpline}</div>
                                  </div>
                                  <div>
                                     <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Official Email</div>
                                     <div className="font-bold text-india-green-600 underline">{complaint.email}</div>
                                  </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-white/80 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 italic">
                            " {complaint.reasoning} "
                        </div>
                    </div>
                </div>

                {/* Right: Timeline & Media */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           <Clock size={18} /> Status Timeline
                        </h3>
                        
                        <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                            {complaint.timeline.filter(t => t.show).map((t, i) => (
                                <div key={i} className="relative pl-10 space-y-1">
                                    <div className={cn(
                                        "absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white flex-shrink-0 z-10",
                                        i === 0 ? "border-saffron-600 text-saffron-600" : "border-slate-200 text-slate-300"
                                    )}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">{t.status.replace('_', ' ')}</div>
                                    <div className="text-xs text-slate-400 font-medium">{t.date}</div>
                                    <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg mt-2">{t.note}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-center">
                        <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400">
                             Media Item Proof
                        </div>
                        <p className="text-xs text-slate-500 italic">User uploaded evidence (1 of 3)</p>
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
