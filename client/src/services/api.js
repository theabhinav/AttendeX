import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attendx_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error parsing & 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and not already on login/register, clear token and redirect
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        localStorage.removeItem('attendx_token');
        localStorage.removeItem('attendx_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
