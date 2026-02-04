// ==========================================================
// ADMIN TYPES
// ==========================================================

export interface Admin {
  email: string;
  role: string;
}

// ==========================================================
// BOOKING TYPES
// ==========================================================

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

export interface BookingSearchParams {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  skip?: number;
}

// ==========================================================
// ANALYTICS TYPES
// ==========================================================

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

// ==========================================================
// AUTH TYPES
// ==========================================================

export interface LoginResponse {
  access_token: string;
  token_type: string;
  email: string;
  role: string;
}

// ==========================================================
// KNOWLEDGE TYPES
// ==========================================================

export interface Knowledge {
  _id: string;
  title: string;
  content: string;
  language: 'en' | 'ne' | 'hi' | 'mr';
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

// ==========================================================
// EVENT TYPES
// ==========================================================

/**
 * Price category for events - represents different ticket tiers
 */
export interface PriceCategory {
  name: string;
  price: number;
  description?: string;
  available_seats?: number;
}

/**
 * Event status enum
 */
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

/**
 * Complete event object returned from the API
 */
export interface Event {
  _id: string;
  title: string;
  bio: string;
  date_from: string; // Date string in ISO format (YYYY-MM-DD)
  date_to: string;   // Date string in ISO format (YYYY-MM-DD)
  time_from: string; // Time string in HH:MM format
  time_to: string;   // Time string in HH:MM format
  location: string;
  location_coords: {
    lat: number;
    lng: number;
  };
  total_seats: number;
  price_details: PriceCategory[];
  main_poster_url: string;
  main_poster_public_id?: string;
  gallery_images: string[];
  gallery_public_ids?: string[];
  is_active: boolean;
  status: EventStatus;
  created_at: string;
  updated_at?: string;
  created_by: string;
  updated_by?: string;
}

/**
 * DTO for creating a new event
 */
export interface CreateEventDto {
  title: string;
  bio: string;
  date_from: string; // Date string in ISO format (YYYY-MM-DD)
  date_to: string;   // Date string in ISO format (YYYY-MM-DD)
  time_from: string; // Time string in HH:MM format
  time_to: string;   // Time string in HH:MM format
  location: string;
  location_coords: {
    lat: number;
    lng: number;
  };
  total_seats: number;
  price_details: PriceCategory[];
  is_active?: boolean;
  status?: EventStatus;
}

/**
 * DTO for updating an existing event
 */
export interface UpdateEventDto {
  title?: string;
  bio?: string;
  date_from?: string;
  date_to?: string;
  time_from?: string;
  time_to?: string;
  location?: string;
  location_coords?: {
    lat: number;
    lng: number;
  };
  total_seats?: number;
  price_details?: PriceCategory[];
  is_active?: boolean;
  status?: EventStatus;
  gallery_images?: string[];
}

/**
 * Event search/filter parameters
 */
export interface EventSearchParams {
  search?: string;
  status?: EventStatus;
  date_from?: string;
  date_to?: string;
  is_active?: boolean;
  limit?: number;
  skip?: number;
}