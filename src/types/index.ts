export interface Admin {
  email: string;
  role: string;
}

export interface Booking {
  _id: string;
  service: string;
  package: string;
  name: string;
  email: string;
  phone: string;
  phone_country: string;
  service_country: string;
  address: string;
  pincode: string;
  date: string;
  message?: string;
  otp_verified: boolean;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface Analytics {
  total_bookings: number;
  pending_bookings: number;
  approved_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  otp_pending: number;
  recent_bookings_7_days: number;
  today_bookings: number;
}

export interface ServiceAnalytics {
  service: string;
  count: number;
}

export interface MonthlyData {
  year: number;
  month: number;
  count: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  email: string;
  role: string;
}

export interface BookingSearchParams {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  skip?: number;
}

export interface Knowledge {
  _id: string;
  title: string;
  content: string;
  language: 'en' | 'ne' | 'hi' | 'mr';
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}