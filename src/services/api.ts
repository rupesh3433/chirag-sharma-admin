import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/admin/login', { email, password }),
  
  verifyToken: () => 
    api.get('/admin/verify-token'),
  
  forgotPassword: (email: string) => 
    api.post('/admin/forgot-password', { email }),
  
  resetPassword: (token: string, new_password: string) => 
    api.post('/admin/reset-password', { token, new_password }),
};

// Bookings API
export const bookingsApi = {
  getAll: (params?: { status?: string; limit?: number; skip?: number }) => 
    api.get('/admin/bookings', { params }),
  
  getById: (id: string) => 
    api.get(`/admin/bookings/${id}`),
  
  search: (params: {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    skip?: number;
  }) => api.post('/admin/bookings/search', params),
  
  updateStatus: (id: string, status: string) => 
    api.patch(`/admin/bookings/${id}/status`, { status }),
  
  delete: (id: string) => 
    api.delete(`/admin/bookings/${id}`),
};

// Analytics API
export const analyticsApi = {
  getOverview: () => 
    api.get('/admin/analytics/overview'),
  
  getByService: () => 
    api.get('/admin/analytics/by-service'),
  
  getByMonth: () => 
    api.get('/admin/analytics/by-month'),
};
