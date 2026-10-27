import axios from 'axios';
import { getVisitorId } from './visitor.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 25000,
});

// Interceptor to always attach the visitor ID header
api.interceptors.request.use(
  (config) => {
    const visitorId = getVisitorId();
    if (visitorId) {
      config.headers['x-visitor-id'] = visitorId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
