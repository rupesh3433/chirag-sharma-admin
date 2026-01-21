import axios, { AxiosError } from 'axios';
import { Knowledge } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* -------------------------------------------------------
   Axios instance
------------------------------------------------------- */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/* -------------------------------------------------------
   Request Interceptor
   → Attach JWT only if present
------------------------------------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------
   Response Interceptor
   → Logout ONLY for protected routes
   → Never break forgot/reset password flow
------------------------------------------------------- */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    const isAuthRoute =
      currentPath.startsWith('/admin/forgot-password') ||
      currentPath.startsWith('/admin/reset-password') ||
      currentPath.startsWith('/admin/login');

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);

export default api;

/* =======================================================
   AUTH API
======================================================= */
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

/* =======================================================
   BOOKINGS API
======================================================= */
export const bookingsApi = {
  getAll: (params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }) =>
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
  }) =>
    api.post('/admin/bookings/search', params),

  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/bookings/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete(`/admin/bookings/${id}`),
};

/* =======================================================
   ANALYTICS API
======================================================= */
export const analyticsApi = {
  getOverview: () =>
    api.get('/admin/analytics/overview'),

  getByService: () =>
    api.get('/admin/analytics/by-service'),

  getByMonth: () =>
    api.get('/admin/analytics/by-month'),
};

/* =======================================================
   KNOWLEDGE BASE API  ✅ ADDED
======================================================= */
export const knowledgeApi = {
  getAll: (params?: { language?: string; is_active?: boolean }) =>
    api.get<Knowledge[]>('/admin/knowledge', { params }),

  getById: (id: string) =>
    api.get<Knowledge>(`/admin/knowledge/${id}`),

  create: (data: Omit<Knowledge, '_id' | 'created_at' | 'updated_at'>) =>
    api.post('/admin/knowledge', data),

  update: (id: string, data: Partial<Knowledge>) =>
    api.patch(`/admin/knowledge/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/knowledge/${id}`),
};
