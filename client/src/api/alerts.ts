import api from './index';
import { Alert } from '../types/alert';

/**
 * Fetches real alerts from the unified backend API.
 * Ensures we are hitting the actual persistence layer, discarding any mocks.
 */
export const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await api.get('/alerts');
  // It expects the backend to return { success: true, alerts: [] } or just the array directly.
  // We'll handle both common Axios data shape patterns.
  if (response.data && response.data.alerts) {
    return response.data.alerts;
  }
  return response.data;
};
