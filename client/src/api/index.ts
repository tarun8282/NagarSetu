import axios from 'axios';

const api = axios.create({
  // @ts-ignore
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Supabase token if available
api.interceptors.request.use(async (config) => {
  // In a real app, you'd get the session from supabase.auth
  return config;
});

export default api;
