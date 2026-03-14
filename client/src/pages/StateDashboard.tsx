import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    MapPin, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    BarChart3,
    Megaphone,
    CheckCircle,
    Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RaiseAlertModal from '../components/alerts/RaiseAlertModal';

const StateDashboard: React.FC = () => {
    const { user } = useAuth();
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [stateStats, setStateStats] = useState<any>(null);
    const [cityPerf, setCityPerf] = useState<any[]>([]);
    const [catDist, setCatDist] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<string>('');

    const fetchAlerts = async () => {
        try {
            if (!user?.state_id) return;
            const alertsRes = await fetch(`/api/alerts?state_id=${user.state_id}`);
            const alertsData = await alertsRes.json();
            if (alertsData.success) {
                setAlerts(alertsData.alerts.slice(0, 6)); // Increased to 6 for better visibility
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
        }
    };

    useEffect(() => {
        const fetchStateData = async () => {
            try {
                if (!user?.state_id) return;
                setLoading(true);
                
                // Fetch Analytics
                const analyticsRes = await fetch(`/api/analytics/state?state_id=${user.state_id}&city_id=${selectedCityId}`);
                const analyticsData = await analyticsRes.json();

                if (analyticsData.success) {
                    setStateStats(analyticsData.stats);
                    setCityPerf(analyticsData.cityPerformance);
                    setCatDist(analyticsData.categoryDistribution);
                    setCities(analyticsData.cities || []);
                } else {
                    setError(analyticsData.error || 'Failed to fetch state analytics');
                }

                // Fetch Alerts
                await fetchAlerts();

            } catch (err: any) {
                setError(err.message || 'Error connecting to analytics server');
            } finally {
                setLoading(false);
            }
        };

        fetchStateData();
    }, [user?.state_id, selectedCityId]);

    const handleAlertSuccess = (msg: string) => {
        setSuccessMessage(msg);
        fetchAlerts(); // Refresh alerts list immediately
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="w-12 h-12 animate-spin text-saffron" />
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading State Intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500 gap-3">
                <AlertCircle className="w-16 h-16" />
                <p className="text-xl font-black">{error}</p>
            </div>
        );
    }
    
    const stats = [
        { label: 'Total Complaints', value: stateStats?.totalComplaints?.toLocaleString() || '0', change: '+0%', isPositive: true, icon: FileText, color: 'text-navy-blue-600', bg: 'bg-navy-blue-50' },
        { label: 'State Resolution', value: `${stateStats?.resolutionRate || 0}%`, change: '+0%', isPositive: true, icon: CheckCircle2, color: 'text-india-green-600', bg: 'bg-india-green-50' },
        { label: 'Active Cities', value: stateStats?.activeCities || '0', change: '0%', isPositive: true, icon: MapPin, color: 'text-saffron-600', bg: 'bg-saffron-50' },
        { label: 'SLA Breaches', value: stateStats?.slaBreaches?.toLocaleString() || '0', change: '-0%', isPositive: true, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const categoryDistributionColors = [
        'bg-navy-blue-600',
        'bg-india-green-600',
        'bg-saffron-600',
        'bg-navy-blue-400',
        'bg-slate-400'
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-saffron-600 font-bold uppercase tracking-wider text-sm">
                        <LayoutDashboard size={16} />
                        State Administration Portal
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {user?.states?.name || 'Maharashtra'} <span className="text-saffron-600">State Overview</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Monitoring civic performance across all municipal corporations.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <Building2 size={16} className="text-slate-400" />
                        <select 
                            value={selectedCityId}
                            onChange={(e) => setSelectedCityId(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="">All Municipal Corporations</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => setIsAlertModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-saffron text-white rounded-xl font-bold hover:bg-saffron-600 transition-all shadow-lg shadow-saffron-200 dark:shadow-none text-sm"
                    >
                        <Megaphone size={18} /> Broadcast Alert
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={stat.label}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.change}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-slate-500 text-sm font-semibold">{stat.label}</div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* City Performance Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Building2 className="text-navy-blue-600" />
                            City Performance Leaderboard
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search cities..." 
                                    className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-navy-blue-500 w-48"
                                />
                            </div>
                            <button className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-500">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">City / Municipal Corp</th>
                                    <th className="px-6 py-4">Total Complaints</th>
                                    <th className="px-6 py-4">Resolution Rate</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {cityPerf.map((city: any) => (
                                    <tr key={city.name} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{city.name}</div>
                                            <div className="text-xs text-slate-400 font-medium">District HQ</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold">{city.complaints.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden min-w-[100px]">
                                                    <div 
                                                        className={`h-full bg-navy-blue-600 rounded-full`} 
                                                        style={{ width: `${city.rate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold">{city.rate}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                city.status === 'Excellent' ? 'bg-green-100 text-green-700' :
                                                city.status === 'Good' ? 'bg-blue-100 text-blue-700' :
                                                'bg-saffron-100 text-saffron-700'
                                            }`}>
                                                {city.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link 
                                                to={`/officer/complaints?city_id=${city.id}`}
                                                className="text-navy-blue-600 dark:text-navy-blue-400 font-bold text-sm hover:underline"
                                            >
                                                View City
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* State-wide Category distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-saffron-600" />
                        Category Distribution
                    </h3>
                    
                    <div className="space-y-5">
                        {catDist.map((cat: any, i: number) => (
                            <div key={cat.category} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-600 dark:text-slate-400 capitalize">{cat.category}</span>
                                    <span className="text-slate-900 dark:text-white">{cat.count.toLocaleString()}</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.percentage}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`h-full ${categoryDistributionColors[i % categoryDistributionColors.length]} rounded-full`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Operational Health
                            <span className="text-india-green-600">Optimal</span>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-3">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                <span className="text-india-green-600 font-bold">Insight:</span> {catDist.length > 0 ? (
                                    `${catDist[0].category} complaints currently represent ${catDist[0].percentage}% of total state volume. Priority attention needed in districts with lower resolution rates.`
                                ) : (
                                    "No significant category trends detected. State resolution is maintaining status quo."
                                )}
                            </p>
                            <Link to="/state/analytics" className="block w-full text-center py-2 text-xs font-black text-navy-blue-600 dark:text-navy-blue-400 uppercase tracking-widest hover:bg-navy-blue/5 rounded-lg transition-all">
                                View Full Analytics
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Map Preview & Announcements */}
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-navy-blue rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/20 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <MapPin className="text-saffron-500" />
                                State Hotspot Map
                            </h3>
                            <p className="text-slate-300 font-medium">Interactive visualization of complaint clusters across all districts.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 py-4">
                            <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                                <div className="text-2xl font-black text-saffron-500">{stateStats?.slaBreaches || '0'}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Escalated</div>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                                <div className="text-2xl font-black text-india-green-500">{stateStats?.resolutionRate || '0'}%</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Efficiency</div>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                                <div className="text-2xl font-black text-white">{stateStats?.activeCities || '0'}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cities Active</div>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-white text-navy-blue rounded-2xl font-black uppercase tracking-widest hover:bg-saffron-500 hover:text-white transition-all transform hover:-translate-y-1">
                            Explore Heatmap
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 flex flex-col justify-between overflow-hidden relative">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Directives</h3>
                        <div className="space-y-4">
                            {alerts.length > 0 ? alerts.map((alert, i) => (
                                <div key={alert.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-bold">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${alert.priority === 'high' ? 'text-red-600' : 'text-navy-blue-600'}`}>{alert.category || 'GENERAL'}</span>
                                            <span className="text-xs text-slate-400 font-medium">• {new Date(alert.published_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-slate-800 dark:text-slate-200 font-bold leading-tight line-clamp-1">{alert.title}</div>
                                    </div>
                                    <ArrowUpRight className="text-slate-300" size={20} />
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 italic font-medium">
                                    No recent state directives found.
                                </div>
                            )}
                        </div>
                    </div>
                    <button className="mt-8 text-center text-slate-400 font-bold text-sm hover:text-navy-blue-600 transition-colors uppercase tracking-widest">
                        View All State Directives
                    </button>
                    <div className="absolute bottom-0 right-0 opacity-10 -mr-8 -mb-8">
                         <Building2 size={200} />
                    </div>
                </div>
            </div>

            {/* Raise Alert Modal */}
            <RaiseAlertModal 
                isOpen={isAlertModalOpen} 
                onClose={() => setIsAlertModalOpen(false)}
                onSuccess={handleAlertSuccess}
            />

            {/* Success Notification */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-india-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md"
                    >
                        <CheckCircle size={24} />
                        <span className="font-bold tracking-tight">{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StateDashboard;
