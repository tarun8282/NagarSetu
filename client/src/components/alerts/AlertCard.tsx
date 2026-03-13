import React from 'react';
import { AlertTriangle, AlertCircle, Info, FileWarning, MapPin, Activity, Calendar } from 'lucide-react';
import { Alert, AlertPriority } from '../../types/alert';

interface AlertCardProps {
  alert: Alert;
}

const getPriorityStyle = (priority: AlertPriority) => {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-900/10',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        icon: <AlertTriangle size={20} className="text-red-600 dark:text-red-500" />
      };
    case 'high':
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-700 dark:text-orange-400',
        icon: <AlertCircle size={20} className="text-orange-600 dark:text-orange-500" />
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/10',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-400',
        icon: <FileWarning size={20} className="text-yellow-600 dark:text-yellow-500" />
      };
    case 'low':
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-400',
        icon: <Info size={20} className="text-blue-600 dark:text-blue-500" />
      };
  }
};

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const styles = getPriorityStyle(alert.priority);
  
  // Try to format date gracefully. If generic string is used by backend, display directly.
  const formattedDate = new Date(alert.publishedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md p-5 ${styles.bg} ${styles.border}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex-shrink-0">
            {styles.icon}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white capitalize">
              <span translate="no">{alert.title}</span>
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span>{alert.description}</span>
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles.text} ${styles.border} bg-white dark:bg-slate-800`}>
          <span>{alert.priority}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Activity size={16} />
          <span className="font-medium">Category:</span>
          <span className="truncate capitalize">{alert.category}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <MapPin size={16} />
          <span className="font-medium">Location:</span>
          <span className="truncate">{alert.location}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <AlertCircle size={16} />
          <span className="font-medium">Source:</span>
          <span className="truncate">{alert.source}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Calendar size={16} />
          <span className="font-medium">Time:</span>
          <span className="truncate" translate="no">{formattedDate === 'Invalid Date' ? alert.publishedAt : formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
