import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, AlertTriangle, Map as MapIcon, Download, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [deptPerf, setDeptPerf] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const cityId = user?.city_id || '';
                const response = await fetch(`/api/analytics/admin?city_id=${cityId}`);
                const data = await response.json();

                if (data.success) {
                    setStats(data.stats);
                    setDeptPerf(data.deptPerformance);
                } else {
                    setError(data.error || 'Failed to fetch analytics');
                }
            } catch (err: any) {
                setError(err.message || 'Error connecting to analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?.city_id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="w-10 h-10 animate-spin text-saffron" />
                <p className="text-slate-400 font-medium">Loading Mumbai Intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500 gap-2">
                <AlertTriangle className="w-12 h-12" />
                <p className="text-lg font-bold">{error}</p>
            </div>
        );
    }

    const kpiData = [
        { label: 'Total Complaints', val: stats?.totalComplaints || 0, delta: '+0%', icon: <BarChart3 className="text-saffron-600" />, color: 'bg-saffron-100' },
        { label: 'Resolution Rate', val: `${stats?.resolutionRate || 0}%`, delta: '+0%', icon: <TrendingUp className="text-india-green-600" />, color: 'bg-india-green-100' },
        { label: 'Active Officers', val: stats?.activeOfficers || 0, delta: '0%', icon: <Users className="text-navy-blue-600" />, color: 'bg-navy-blue-100' },
        { label: 'SLA Breaches', val: stats?.slaBreaches || 0, delta: '-0%', icon: <AlertTriangle className="text-saffron-700" />, color: 'bg-saffron-200' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {user?.cities?.name || 'Mumbai'} City Overview
                    </h1>
                    <p className="text-slate-500 font-medium">Real-time performance across all municipal departments.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                    <Download size={18} /> Export Report
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4 hover:shadow-xl transition-shadow relative overflow-hidden">
                        <div className={`w-14 h-14 ${kpi.color} rounded-lg flex items-center justify-center`}>
                           {kpi.icon}
                        </div>
                        <div className="space-y-1">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">{kpi.label}</div>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">{kpi.val}</span>
                                <span className="text-sm font-bold text-green-500 mb-1">{kpi.delta}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Department Leaderboard */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-saffron-600" /> Department Performance
                    </h3>
                    <div className="space-y-6">
                        {deptPerf.length > 0 ? deptPerf.map((d, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-tighter">
                                    <span className="text-slate-700 dark:text-slate-300">{d.dept}</span>
                                    <span className="text-slate-900 dark:text-white">{d.rate}% Resolved</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                                    <div className={`h-full bg-saffron transition-all duration-1000`} style={{ width: `${d.rate}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-400 italic">No department data available yet.</p>
                        )}
                    </div>
                </div>

                {/* City Heatmap Preview Placeholder */}
                <div className="bg-navy-blue text-white p-8 rounded-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570160897040-d8229fb9c922?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-blue via-transparent to-transparent"></div>
                    
                    <div className="relative z-10 h-full flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-tighter">
                                <MapIcon className="text-saffron-500" /> Hotspot Map
                            </h3>
                            <p className="text-slate-400 text-sm">Visualizing complaint density across the city.</p>
                        </div>
                        <Link to="/heatmap" className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center gap-2 font-bold transition-all border border-white/10">
                            Explore Heatmap <TrendingUp size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
