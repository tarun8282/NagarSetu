import React from 'react';
import { LayoutDashboard, ListFilter, Clock, Search } from 'lucide-react';

const DepartmentDashboard: React.FC = () => {
    // Mock data for Officer
    const complaints = [
        { id: '1', number: 'MH-MUM-2024-0342', title: 'Deep Pothole on Linking Road', status: 'in_progress', priority: 'high', date: '2 hours ago' },
        { id: '2', number: 'MH-MUM-2024-0345', title: 'Road damage near Juhu', status: 'under_review', priority: 'medium', date: '5 hours ago' },
        { id: '3', number: 'MH-MUM-2024-0350', title: 'Potholes in Bandra East', status: 'escalated', priority: 'critical', date: '1 day ago' },
    ];

    return (
        <div className="space-y-10">
            {/* Officer Header */}
            <div className="bg-navy-blue text-white p-10 rounded-lg relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-10 text-white/5 -z-10 rotate-12">
                   <LayoutDashboard size={200} />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="inline-block px-4 py-1 bg-saffron/20 text-saffron-300 rounded-lg text-xs font-bold uppercase tracking-widest border border-saffron/30">
                        Officer Dashboard
                    </div>
                    <h1 className="text-4xl font-bold font-deva">BMC Roads Department</h1>
                    <p className="text-slate-300 max-w-lg">Manage your assigned complaints and resolve them before the SLA deadline.</p>
                </div>
            </div>

            {/* Performance Mini Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Assigned Today', val: '12', color: 'text-navy-blue-600', bg: 'bg-navy-blue-50' },
                    { label: 'Avg Resolution', val: '14.5h', color: 'text-saffron-600', bg: 'bg-saffron-50' },
                    { label: 'SLA Compliance', val: '92%', color: 'text-india-green-600', bg: 'bg-india-green-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">{stat.label}</div>
                        <div className={`text-4xl font-black ${stat.color}`}>{stat.val}</div>
                    </div>
                ))}
            </div>

            {/* Queue Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Clock className="text-saffron-600" /> Pending Queue
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search ID..." className="pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-saffron-500 transition-all shadow-sm w-64" />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <ListFilter size={18} /> Filters
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">ID & Title</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Priority</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {complaints.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="font-mono text-xs font-bold text-saffron-600 mb-1">{c.number}</div>
                                        <div className="font-bold text-slate-900 dark:text-white uppercase group-hover:text-navy-blue-600 transition-colors">{c.title}</div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                            <Clock size={12} /> Received {c.date}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                            c.priority === 'critical' ? "bg-saffron-100 text-saffron-700 border-saffron-200" :
                                            c.priority === 'high' ? "bg-saffron-50 text-saffron-600 border-saffron-200" : "bg-navy-blue-100 text-navy-blue-700 border-navy-blue-200"
                                        )}>
                                            {c.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="capitalize text-slate-600 dark:text-slate-400 font-medium text-sm border px-3 py-1 rounded-lg bg-white dark:bg-slate-900">
                                            {c.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="px-6 py-2 bg-saffron text-white rounded-lg font-bold text-sm hover:bg-saffron-600 shadow-lg shadow-saffron-200 transition-all">
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default DepartmentDashboard;
