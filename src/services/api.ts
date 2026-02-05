import axios, { AxiosError } from 'axios';
import { Knowledge, Event, EventStatus, PriceCategory, CreateEventDto } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* -------------------------------------------------------
   Axios instance with EXTENDED TIMEOUT for slow backend
------------------------------------------------------- */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds timeout for slow backend responses
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
   → Handle timeout and network errors gracefully
------------------------------------------------------- */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timeout - server took too long to respond. Please try again.',
        code: 'TIMEOUT',
        isTimeout: true,
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error - please check your internet connection.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
      });
    }

    const status = error.response?.status;
    const currentPath = window.location.pathname;

    const isAuthRoute =
      currentPath.startsWith('/admin/forgot-password') ||
      currentPath.startsWith('/admin/reset-password') ||
      currentPath.startsWith('/admin/login');

    // Only logout for 401 on protected routes
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
   KNOWLEDGE BASE API
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

/* =======================================================
   EVENTS API 
======================================================= */
export const eventsApi = {
  // Image upload
  uploadImage: (file: File, folder: string = 'events') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{
      url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
    }>('/admin/events/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for image uploads
    });
  },

  deleteImage: (public_id: string) =>
    api.delete<{ success: boolean }>(`/admin/events/delete-image/${public_id}`),

  // Events CRUD
  getAll: (params?: {
    status?: EventStatus;
    is_active?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) => 
    api.get<{
      events: Event[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }>('/admin/events', { params }),

  getById: (id: string) => api.get<Event>(`/admin/events/${id}`),

  create: (data: FormData) =>
    api.post<{ message: string; event: Event }>('/admin/events', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for creating events with images
    }),

  updateWithFiles: async (id: string, formData: FormData) => {
    const token = localStorage.getItem('admin_token');
    
    // Create abort controller for manual timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update event');
      }
      
      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - upload took too long. Please try again.');
      }
      throw error;
    }
  },
  
  update: (id: string, data: Partial<Event>) =>
    api.put<{ message: string; event: Event }>(`/admin/events/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/admin/events/${id}`),

  updateStatus: (id: string, status: EventStatus) =>
    api.patch<{ message: string }>(`/admin/events/${id}/status`, null, {
      params: { status }
    }),

  toggleActive: (id: string) =>
    api.patch<{ message: string; is_active: boolean }>(`/admin/events/${id}/toggle-active`),

  uploadGalleryImages: (id: string, images: File[]) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    return api.post<{ message: string; new_images: string[] }>(
      `/admin/events/${id}/upload-gallery`,
      formData,
      { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minutes for gallery uploads
      }
    );
  },

  deleteGalleryImage: (eventId: string, imageIndex: number) =>
    api.delete<{ message: string }>(`/admin/events/${eventId}/gallery/${imageIndex}`),
};