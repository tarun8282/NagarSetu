import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Info, Loader, AlertCircle, LocateFixed } from 'lucide-react';

// Inner component to safely hook into the Leaflet map state and pan 
const MapConsumer = ({ userLocation, recenterTrigger }: { userLocation: [number, number], recenterTrigger: number }) => {
    const map = useMap();
    useEffect(() => {
        if (userLocation) {
            // Smoothly pan and zoom to the user's location over 1.5 seconds
            map.flyTo(userLocation, 14, { duration: 1.5 });
        }
    }, [userLocation, map, recenterTrigger]);
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

// Create custom icons for different priority levels
const createIcon = (priority: string) => {
    const colors: { [key: string]: string } = {
        'high': '#ef4444',
        'critical': '#991b1b',
        'medium': '#f97316',
        'low': '#22c55e', // Green instead of blue to avoid user-location clash
        'urgent': '#dc2626'
    };

    const color = colors[priority?.toLowerCase()] || '#64748b';

    return L.divIcon({
        html: `<div style="background: ${color}; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        className: 'custom-marker'
    });
};

// Create custom icon for user's current location
const createUserIcon = () => {
    return L.divIcon({
        html: `<div style="background: #2563eb; border: 2px solid white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3), 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        className: 'user-marker'
    });
};

const HeatmapView: React.FC = () => {
    const position: [number, number] = [19.0760, 72.8777]; // Mumbai center
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
    const [filterPriority, setFilterPriority] = useState<string>('all');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await fetch('/api/complaints');
                const data = await response.json();

                if (data.success) {
                    // Filter complaints with valid coordinates
                    const complaintsWithCoords = (data.complaints || []).filter(
                        (c: Complaint) => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude)
                    );
                    console.log('Fetched complaints:', complaintsWithCoords);
                    console.log('Total complaints:', data.complaints?.length, 'With coords:', complaintsWithCoords.length);
                    setComplaints(complaintsWithCoords);
                    setFilteredComplaints(complaintsWithCoords);
                } else {
                    setError(data.error || 'Failed to fetch complaints');
                }
            } catch (err: any) {
                setError(err.message || 'Error fetching complaints');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();

        // Get user location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.log("Error getting user location:", error);
                }
            );
        }
    }, []);

    useEffect(() => {
        if (filterPriority === 'all') {
            setFilteredComplaints(complaints);
        } else {
            const filtered = complaints.filter(c => {
                const priority = (c.priority || 'medium').toLowerCase();
                return priority === filterPriority.toLowerCase();
            });
            setFilteredComplaints(filtered);
        }
    }, [filterPriority, complaints]);

    const getPriorityColor = (priority?: string) => {
        const colors: { [key: string]: string } = {
            'high': 'bg-red-500',
            'critical': 'bg-red-900',
            'medium': 'bg-orange-500',
            'low': 'bg-green-500',
            'urgent': 'bg-red-600'
        };
        return colors[priority ? priority.toLowerCase() : ''] || 'bg-slate-500';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'text-green-600';
            case 'in_progress':
            case 'under_review':
                return 'text-blue-600';
            default:
                return 'text-orange-600';
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl relative bg-slate-100 dark:bg-slate-900">
            {/* Error Message */}
            {error && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="text-center space-y-4">
                        <Loader className="animate-spin h-10 w-10 text-saffron-600 mx-auto" />
                        <p className="text-slate-600 dark:text-slate-400 font-semibold">Loading complaints...</p>
                    </div>
                </div>
            )}



            {/* Recenter Button - Bottom Left */}
            {userLocation && (
                <div className="absolute bottom-6 left-6 z-[1000] pointer-events-auto">
                    <button 
                        onClick={() => setRecenterTrigger(prev => prev + 1)}
                        className="p-3 bg-white/90 text-slate-700 hover:bg-white hover:text-saffron-600 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-saffron-400 backdrop-blur-md rounded-xl font-bold flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
                        title="Recenter on my location"
                    >
                        <LocateFixed size={24} />
                    </button>
                </div>
            )}

            {/* Legend & Filter Panel */}
            <div className="absolute bottom-6 right-6 z-[1000] space-y-3 pointer-events-auto min-w-[200px]">
                <div className="p-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Filter Map</label>
                        <select
                            value={filterPriority}
                            onChange={(e) => {
                                console.log('Filter changed to:', e.target.value); // Debug log
                                setFilterPriority(e.target.value);
                            }}
                            className="w-full px-3 py-2 text-slate-700 dark:text-slate-300 text-sm font-bold bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer outline-none focus:border-saffron"
                        >
                            <option value="all">All Priorities ({complaints.length})</option>
                            <option value="critical">Critical ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'critical').length})</option>
                            <option value="high">High ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'high').length})</option>
                            <option value="medium">Medium ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'medium').length})</option>
                            <option value="low">Low ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'low').length})</option>
                        </select>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Priority Legends</div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-900 shadow-lg shadow-red-900/30"></div>
                            <span className="text-xs font-bold dark:text-white">Critical ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'critical').length})</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500 shadow-lg shadow-red-500/30"></div>
                            <span className="text-xs font-bold dark:text-white">High ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'high').length})</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30"></div>
                            <span className="text-xs font-bold dark:text-white">Medium ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'medium').length})</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 shadow-lg shadow-green-500/30"></div>
                            <span className="text-xs font-bold dark:text-white">Low ({complaints.filter(c => (c.priority || 'medium').toLowerCase() === 'low').length})</span>
                        </div>
                    </div>
                </div>
            </div>

                {filteredComplaints.length > 0 && (
                    <div className="p-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Filtered Results
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {filterPriority === 'all' 
                                ? `Showing all ${filteredComplaints.length} complaints`
                                : `${filteredComplaints.length} ${filterPriority} priority complaints`
                            }
                        </div>
                    </div>
                )}
            </div>

            {!loading && filteredComplaints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
                    <div className="text-center space-y-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Info className="mx-auto text-slate-400" size={40} />
                        <p className="text-slate-600 dark:text-slate-400 font-semibold">No complaints found</p>
                    </div>
                </div>
            )}

            <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="h-full w-full z-0">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Display complaint markers */}
                {filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => {
                        console.log('Rendering marker for:', complaint.complaint_number, complaint.title, complaint.latitude, complaint.longitude, complaint.priority);
                        return (
                            <Marker
                                key={complaint.id}
                                position={[complaint.latitude, complaint.longitude]}
                                icon={createIcon(complaint.priority || 'low')}
                            >
                                <Popup>
                                    <div className="space-y-2 w-64">
                                        <div className="font-bold text-slate-900">{complaint.title}</div>
                                        <div className="text-sm text-slate-600">{complaint.description}</div>
                                        <div className="text-xs text-slate-500">{complaint.address}</div>
                                        <div className="flex gap-2 pt-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(complaint.priority)}`}>
                                                {(complaint.priority || 'unknown').toUpperCase()}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusColor(complaint.status)}`}>
                                                {complaint.status.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">{complaint.complaint_number}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })
                ) : null}

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={createUserIcon()}>
                        <Popup>
                            <div className="font-bold text-slate-900">Your Current Location</div>
                        </Popup>
                    </Marker>
                )}
                
                {/* Dynamically Re-Center Map on User Location */}
                {userLocation && (
                    <MapConsumer userLocation={userLocation} recenterTrigger={recenterTrigger} />
                )}

                {/* City center marker */}
                <Circle center={position} radius={1000} pathOptions={{ color: 'blue', weight: 1, opacity: 0.2 }} />
            </MapContainer>
        </div>
    );
};

export default HeatmapView;
