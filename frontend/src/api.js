import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the session token if it exists
api.interceptors.request.use(
  async (config) => {
    // Fetch the current session dynamically from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
