import axios from 'axios';

// Create central Axios instance (auto-detects local dev vs production on Vercel)
const api = axios.create({
  baseURL:  'https://pharmacy-management-1-aa6x.onrender.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors and handle common status codes
api.interceptors.response.use(
  (response) => {
    return response.data; // Directly return data payload (standardized success structures)
  },
  (error) => {
    // Extract server-provided error message or fallback
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Handle unauthorized/session expired cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Optional: Redirect to login or dispatch auth reset event
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Format error object for clean promise rejection
    const formattedError = new Error(message);
    formattedError.status = error.response?.status;
    formattedError.data = error.response?.data;
    
    return Promise.reject(formattedError);
  }
);

export default api;
