import React, { useEffect, useState } from 'react';
import { fetchAlerts } from '../api/alerts';
import { Alert } from '../types/alert';
import AlertCard from '../components/alerts/AlertCard';
import { Bell, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts();
      if (Array.isArray(data)) {
        // Sort alerts by published date (newest first)
        const sortedData = [...data].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setAlerts(sortedData);
      } else {
        // If API returns no array or unexpected shape but successfully returned
        setAlerts([]);
      }
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to load official alerts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section matching dashboard aesthetics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 dark:opacity-5 text-slate-900 dark:text-white pointer-events-none">
            <svg width="150" height="150" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
            </svg>
        </div>
        <div className="space-y-2 relative z-10 flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-xl">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-deva">City Alerts</h1>
            <p className="text-slate-500 dark:text-slate-400">Important civic notices, roadworks, and emergency broadcasts.</p>
          </div>
        </div>
        
        <button 
          onClick={loadAlerts} 
          disabled={loading}
          className="relative z-10 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 self-start md:self-auto shadow-sm"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <Loader2 className="animate-spin text-saffron-600 dark:text-saffron-500 w-10 h-10" />
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Fetching official alerts...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl shadow-sm space-y-4">
            <AlertCircle className="text-red-500 w-12 h-12" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Communication Error</h3>
              <p className="text-red-600 dark:text-red-300 max-w-md">{error}</p>
            </div>
            <button 
              onClick={loadAlerts}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Bell className="text-slate-400 dark:text-slate-500 w-12 h-12 opacity-50" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Active Alerts</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                There are currently no active civic alerts or emergency broadcasts in your region.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
