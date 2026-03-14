import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Info, Loader, AlertCircle, LocateFixed, Map } from 'lucide-react';

/* ─── Fly-to User Hook ──────────────────────────────────────── */
const FlyToUser: React.FC<{ location: [number, number]; trigger: number }> = ({ location, trigger }) => {
    const map = useMap();
    useEffect(() => {
        if (location) map.flyTo(location, 14, { duration: 1.5 });
    }, [trigger]);
    return null;
};

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

const PRIORITY_COLORS: Record<string, string> = {
    critical: '#991b1b',
    high:     '#ef4444',
    medium:   '#f97316',
    low:      '#22c55e',
};

const createIcon = (priority: string) => {
    const color = PRIORITY_COLORS[priority?.toLowerCase()] || '#64748b';
    return L.divIcon({
        html: `<div style="background:${color};border:3px solid white;border-radius:50%;width:24px;height:24px;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        className: 'custom-marker',
    });
};

const createUserIcon = () => L.divIcon({
    html: `<div style="background:#2563eb;border:2px solid white;border-radius:50%;width:14px;height:14px;box-shadow:0 0 0 4px rgba(37,99,235,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    className: 'user-marker',
});

const AdminHeatmapView: React.FC = () => {
    const defaultCenter: [number, number] = [19.076, 72.8777];
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterPriority, setFilterPriority] = useState('all');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [recenterTrigger, setRecenterTrigger] = useState(0);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await fetch('/api/complaints/heatmap');
                const data = await response.json();
                if (data.success) {
                    setComplaints(data.complaints || []);
                    setFilteredComplaints(data.complaints || []);
                } else {
                    setError(data.error || 'Failed to fetch complaints');
                }
            } catch (err: any) {
                setError('Could not reach server.');
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

    useEffect(() => {
        if (filterPriority === 'all') {
            setFilteredComplaints(complaints);
        } else {
            setFilteredComplaints(complaints.filter(c => (c.priority || 'medium').toLowerCase() === filterPriority));
        }
    }, [filterPriority, complaints]);

    const getPriorityClass = (p?: string) => ({
        critical: 'bg-red-900 text-white',
        high: 'bg-red-500 text-white',
        medium: 'bg-orange-500 text-white',
        low: 'bg-green-500 text-white',
    })[p?.toLowerCase() || ''] || 'bg-slate-500 text-white';

    return (
        <div className="h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl relative">

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                    <div className="text-center space-y-3">
                        <Loader className="animate-spin h-10 w-10 text-[#FF9933] mx-auto" />
                        <p className="text-slate-500 font-semibold text-sm">Loading complaint markers…</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm shadow-lg">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {!loading && filteredComplaints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
                    <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <Map className="mx-auto text-slate-300 mb-2" size={44} />
                        <p className="font-bold text-slate-600 dark:text-slate-300">No complaints with location data</p>
                        <p className="text-xs text-slate-400">Complaints submitted with GPS enabled will appear here</p>
                    </div>
                </div>
            )}

            {/* Recenter */}
            {userLocation && (
                <div className="absolute bottom-6 left-6 z-[1000]">
                    <button
                        onClick={() => setRecenterTrigger(t => t + 1)}
                        className="p-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 backdrop-blur-md rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#FF9933] shadow-lg transition-all active:scale-95"
                    >
                        <LocateFixed size={22} />
                    </button>
                </div>
            )}

            {/* Legend + Filter */}
            <div className="absolute bottom-6 right-6 z-[1000] space-y-3 min-w-[200px]">
                <div className="p-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Filter Priority</label>
                        <select
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300"
                        >
                            <option value="all">All Priorities ({complaints.length})</option>
                            <option value="critical">Critical ({complaints.filter(c => (c.priority||'').toLowerCase()==='critical').length})</option>
                            <option value="high">High ({complaints.filter(c => (c.priority||'').toLowerCase()==='high').length})</option>
                            <option value="medium">Medium ({complaints.filter(c => (c.priority||'').toLowerCase()==='medium').length})</option>
                            <option value="low">Low ({complaints.filter(c => (c.priority||'').toLowerCase()==='low').length})</option>
                        </select>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Legend</div>
                        {[
                            { label: 'Critical', color: '#991b1b' },
                            { label: 'High',     color: '#ef4444' },
                            { label: 'Medium',   color: '#f97316' },
                            { label: 'Low',      color: '#22c55e' },
                        ].map(({ label, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
                                <span className="text-xs font-bold text-slate-700 dark:text-white">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {filteredComplaints.length > 0 && (
                    <div className="px-4 py-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Showing {filteredComplaints.length} complaints
                    </div>
                )}
            </div>

            <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-full w-full z-0">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {filteredComplaints.map(c => (
                    <Marker key={c.id} position={[c.latitude, c.longitude]} icon={createIcon(c.priority || 'medium')}>
                        <Popup>
                            <div className="space-y-1.5 w-60">
                                <div className="font-bold text-slate-900">{c.title}</div>
                                <div className="text-sm text-slate-600">{c.description}</div>
                                <div className="text-xs text-slate-400">{c.address}</div>
                                <div className="flex gap-2 pt-1">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${getPriorityClass(c.priority)}`}>
                                        {(c.priority || 'medium').toUpperCase()}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-600">
                                        {c.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-xs font-mono text-slate-400">{c.complaint_number}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                {userLocation && (
                    <>
                        <Marker position={userLocation} icon={createUserIcon()}>
                            <Popup><div className="font-bold text-slate-900">Your Location</div></Popup>
                        </Marker>
                        <FlyToUser location={userLocation} trigger={recenterTrigger} />
                    </>
                )}
                <Circle center={defaultCenter} radius={1000} pathOptions={{ color: 'blue', weight: 1, opacity: 0.2 }} />
            </MapContainer>
        </div>
    );
};

export default AdminHeatmapView;
