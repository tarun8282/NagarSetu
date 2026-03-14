import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Info, Loader, AlertCircle, LocateFixed, Flame, Map, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminHeatmapView from './AdminHeatmapView';

/* ─── Type Augmentation for leaflet.heat ───────────────────── */
declare module 'leaflet' {
    function heatLayer(
        latlngs: Array<[number, number, number?]>,
        options?: {
            minOpacity?: number;
            maxZoom?: number;
            max?: number;
            radius?: number;
            blur?: number;
            gradient?: Record<string, string>;
        }
    ): L.Layer & { setLatLngs: (points: Array<[number, number, number?]>) => void };
}

interface Complaint {
    id: string;
    complaint_number: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: string;
    address: string;
    priority?: string;
}

const PRIORITY_WEIGHT: Record<string, number> = {
    critical: 1.0,
    high:     0.75,
    medium:   0.5,
    low:      0.25,
};

/* ─── Heat Layer Component ───────────────────────────────────── */
const HeatLayer: React.FC<{ points: Array<[number, number, number]> }> = ({ points }) => {
    const map = useMap();
    const layerRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;
        if (layerRef.current) map.removeLayer(layerRef.current);
        if (points.length === 0) return;

        const heat = (L as any).heatLayer(points, {
            radius: 35,
            blur: 25,
            maxZoom: 17,
            minOpacity: 0.4,
            gradient: {
                0.0: '#313695',
                0.2: '#4575b4',
                0.35: '#74add1',
                0.5: '#fee090',
                0.65: '#f46d43',
                0.8: '#d73027',
                1.0: '#a50026',
            },
        });

        heat.addTo(map);
        layerRef.current = heat;

        return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
    }, [map, points]);

    return null;
};

const FlyToUser: React.FC<{ location: [number, number]; trigger: number }> = ({ location, trigger }) => {
    const map = useMap();
    useEffect(() => { if (location) map.flyTo(location, 14, { duration: 1.5 }); }, [trigger]);
    return null;
};

/* ─── Citizen Thermal Heatmap ────────────────────────────────── */
const CitizenHeatmap: React.FC = () => {
    const defaultCenter: [number, number] = [19.076, 72.8777];
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [recenterTrigger, setRecenterTrigger] = useState(0);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await fetch('/api/complaints/heatmap');
                const data = await response.json();
                if (data.success) {
                    setComplaints(data.complaints || []);
                } else {
                    setError(data.error || 'Failed to fetch complaints');
                }
            } catch (err: any) {
                setError('Could not reach server. Is the backend running?');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
        navigator.geolocation?.getCurrentPosition(
            pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            () => {}
        );
    }, []);

    const heatPoints: Array<[number, number, number]> = complaints
        .filter(c => {
            const matchPriority = filterPriority === 'all' || (c.priority || 'medium').toLowerCase() === filterPriority;
            const matchStatus   = filterStatus === 'all'   || c.status === filterStatus;
            return matchPriority && matchStatus;
        })
        .map(c => [c.latitude, c.longitude, PRIORITY_WEIGHT[(c.priority || 'medium').toLowerCase()] ?? 0.5]);

    const counts = {
        critical: complaints.filter(c => (c.priority || '').toLowerCase() === 'critical').length,
        high:     complaints.filter(c => (c.priority || '').toLowerCase() === 'high').length,
        medium:   complaints.filter(c => (c.priority || '').toLowerCase() === 'medium').length,
        low:      complaints.filter(c => (c.priority || '').toLowerCase() === 'low').length,
    };

    return (
        <div className="space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-[#FF9933]" /> Complaint Heatmap
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Visualise complaint density across all wards in real time</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { label: 'Critical', count: counts.critical, color: '#a50026' },
                        { label: 'High',     count: counts.high,     color: '#d73027' },
                        { label: 'Medium',   count: counts.medium,   color: '#f46d43' },
                        { label: 'Low',      count: counts.low,      color: '#4575b4' },
                    ].map(({ label, count, color }) => (
                        <div key={label} className="px-3 py-1.5 rounded-lg text-center border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="text-sm font-black" style={{ color }}>{count}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters:</span>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30">
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30">
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                </select>
                <span className="ml-auto text-xs text-slate-400 font-medium">{heatPoints.length} of {complaints.length} points shown</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl"
                style={{ height: 'calc(100vh - 260px)', minHeight: '440px' }}>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                        <div className="text-center space-y-3">
                            <Loader className="animate-spin h-10 w-10 text-[#FF9933] mx-auto" />
                            <p className="text-slate-500 font-semibold text-sm">Loading heatmap data…</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm shadow-lg">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {!loading && !error && heatPoints.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
                        <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                            <Map className="mx-auto text-slate-300" size={44} />
                            <p className="font-bold text-slate-600 dark:text-slate-300">No complaints with location data</p>
                            <p className="text-xs text-slate-400">Complaints submitted with GPS enabled will appear here</p>
                        </div>
                    </div>
                )}

                {userLocation && (
                    <div className="absolute bottom-5 left-5 z-[1000]">
                        <button onClick={() => setRecenterTrigger(t => t + 1)} title="Re-center on my location"
                            className="p-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 backdrop-blur-md rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#FF9933] shadow-lg transition-all active:scale-95">
                            <LocateFixed size={22} />
                        </button>
                    </div>
                )}

                <div className="absolute bottom-5 right-5 z-[1000] bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl min-w-[140px]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                        <Flame size={10} className="text-[#FF9933]" /> Intensity
                    </p>
                    <div className="w-full h-3 rounded-full mb-2" style={{ background: 'linear-gradient(to right,#313695,#4575b4,#74add1,#fee090,#f46d43,#d73027,#a50026)' }} />
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-3">
                        <span>Sparse</span><span>Hotspot</span>
                    </div>
                    {[
                        { label: 'Critical', color: '#a50026' },
                        { label: 'High',     color: '#d73027' },
                        { label: 'Medium',   color: '#f46d43' },
                        { label: 'Low',      color: '#4575b4' },
                    ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-2 mb-1">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                        </div>
                    ))}
                </div>

                <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-full w-full z-0" style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                    <HeatLayer points={heatPoints} />
                    {userLocation && <FlyToUser location={userLocation} trigger={recenterTrigger} />}
                </MapContainer>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 px-1">
                <Info size={13} />
                Heatmap intensity is weighted by complaint priority — critical issues glow brighter. Zoom in to see individual complaint hotspots.
            </div>
        </div>
    );
};

/* ─── Smart Dispatcher — Single Route, Two Experiences ──────── */
const HeatmapView: React.FC = () => {
    const { user } = useAuth();

    // Thermal heatmap for: unauthenticated (landing page) + citizens
    // Marker map for: officers, MC admins, state admins
    if (!user || user?.role === 'citizen') {
        return <CitizenHeatmap />;
    }

    return <AdminHeatmapView />;
};

export default HeatmapView;
