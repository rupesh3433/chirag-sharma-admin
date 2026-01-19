import { Analytics, Booking, ServiceAnalytics, MonthlyData } from '@/types';

// Demo analytics data
export const demoAnalytics: Analytics = {
  total_bookings: 156,
  pending_bookings: 23,
  completed_bookings: 118,
  cancelled_bookings: 15,
  otp_pending: 8,
  recent_bookings_7_days: 12,
  today_bookings: 3,
};

// Demo service analytics
export const demoServiceData: ServiceAnalytics[] = [
  { service: 'Bridal Makeup', count: 45 },
  { service: 'Party Makeup', count: 38 },
  { service: 'Engagement Makeup', count: 28 },
  { service: 'Pre-Wedding Shoot', count: 22 },
  { service: 'HD Makeup', count: 15 },
  { service: 'Airbrush Makeup', count: 8 },
];

// Demo monthly data
export const demoMonthlyData: MonthlyData[] = [
  { year: 2026, month: 1, count: 12 },
  { year: 2025, month: 12, count: 18 },
  { year: 2025, month: 11, count: 15 },
  { year: 2025, month: 10, count: 22 },
  { year: 2025, month: 9, count: 28 },
  { year: 2025, month: 8, count: 20 },
  { year: 2025, month: 7, count: 16 },
  { year: 2025, month: 6, count: 14 },
  { year: 2025, month: 5, count: 19 },
  { year: 2025, month: 4, count: 25 },
  { year: 2025, month: 3, count: 21 },
  { year: 2025, month: 2, count: 17 },
];

// Demo bookings
export const demoBookings: Booking[] = [
  {
    _id: '6789abcd1234ef5678901234',
    service: 'Bridal Makeup',
    package: 'Premium Package',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '9876543210',
    phone_country: '+91',
    service_country: 'India',
    address: '123 MG Road, Sector 15',
    pincode: '110001',
    date: '2026-02-14',
    message: 'Looking for traditional bridal look with red theme. Need makeup artist to arrive by 6 AM.',
    otp_verified: true,
    status: 'pending',
    created_at: '2026-01-18T10:30:00Z',
  },
  {
    _id: '6789abcd1234ef5678901235',
    service: 'Party Makeup',
    package: 'Standard Package',
    name: 'Anjali Verma',
    email: 'anjali.v@gmail.com',
    phone: '8765432109',
    phone_country: '+91',
    service_country: 'India',
    address: '45 Park Avenue, Connaught Place',
    pincode: '110002',
    date: '2026-01-25',
    message: 'Birthday party makeup for evening event.',
    otp_verified: true,
    status: 'completed',
    created_at: '2026-01-15T14:20:00Z',
    updated_at: '2026-01-25T20:00:00Z',
  },
  {
    _id: '6789abcd1234ef5678901236',
    service: 'Engagement Makeup',
    package: 'Deluxe Package',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@yahoo.com',
    phone: '7654321098',
    phone_country: '+91',
    service_country: 'India',
    address: '78 Jubilee Hills',
    pincode: '500033',
    date: '2026-02-01',
    message: 'Engagement ceremony, prefer natural glowy look.',
    otp_verified: true,
    status: 'pending',
    created_at: '2026-01-17T09:15:00Z',
  },
  {
    _id: '6789abcd1234ef5678901237',
    service: 'HD Makeup',
    package: 'Basic Package',
    name: 'Kavita Joshi',
    email: 'kavita.j@outlook.com',
    phone: '6543210987',
    phone_country: '+91',
    service_country: 'India',
    address: '22 Banjara Hills',
    pincode: '500034',
    date: '2026-01-28',
    message: 'Corporate photoshoot, professional look needed.',
    otp_verified: false,
    status: 'otp_pending',
    created_at: '2026-01-19T11:45:00Z',
  },
  {
    _id: '6789abcd1234ef5678901238',
    service: 'Bridal Makeup',
    package: 'Ultimate Package',
    name: 'Meera Nair',
    email: 'meera.nair@gmail.com',
    phone: '5432109876',
    phone_country: '+91',
    service_country: 'India',
    address: '99 Marine Drive',
    pincode: '400001',
    date: '2026-03-15',
    message: 'South Indian wedding, need traditional makeup with jewelry coordination.',
    otp_verified: true,
    status: 'pending',
    created_at: '2026-01-16T16:30:00Z',
  },
  {
    _id: '6789abcd1234ef5678901239',
    service: 'Pre-Wedding Shoot',
    package: 'Premium Package',
    name: 'Ritu Agarwal',
    email: 'ritu.a@gmail.com',
    phone: '4321098765',
    phone_country: '+91',
    service_country: 'India',
    address: '55 Hauz Khas Village',
    pincode: '110016',
    date: '2026-01-22',
    message: 'Pre-wedding shoot in heritage location, multiple looks required.',
    otp_verified: true,
    status: 'completed',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-22T18:00:00Z',
  },
  {
    _id: '6789abcd1234ef5678901240',
    service: 'Party Makeup',
    package: 'Standard Package',
    name: 'Divya Kapoor',
    email: 'divya.k@hotmail.com',
    phone: '3210987654',
    phone_country: '+91',
    service_country: 'India',
    address: '12 Vasant Vihar',
    pincode: '110057',
    date: '2026-01-20',
    message: 'Anniversary dinner, elegant evening look.',
    otp_verified: true,
    status: 'cancelled',
    created_at: '2026-01-12T13:00:00Z',
    updated_at: '2026-01-18T10:00:00Z',
  },
  {
    _id: '6789abcd1234ef5678901241',
    service: 'Airbrush Makeup',
    package: 'Deluxe Package',
    name: 'Nisha Gupta',
    email: 'nisha.g@gmail.com',
    phone: '2109876543',
    phone_country: '+91',
    service_country: 'India',
    address: '33 Defence Colony',
    pincode: '110024',
    date: '2026-02-05',
    message: 'Wedding reception, long-lasting makeup needed.',
    otp_verified: true,
    status: 'pending',
    created_at: '2026-01-19T07:30:00Z',
  },
];

// Helper function to filter demo bookings
export const filterDemoBookings = (params: {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  skip?: number;
}) => {
  let filtered = [...demoBookings];

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(searchLower) ||
        b.email.toLowerCase().includes(searchLower) ||
        b.phone.includes(searchLower) ||
        b.service.toLowerCase().includes(searchLower)
    );
  }

  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((b) => b.status === params.status);
  }

  if (params.date_from) {
    filtered = filtered.filter((b) => b.date >= params.date_from!);
  }

  if (params.date_to) {
    filtered = filtered.filter((b) => b.date <= params.date_to!);
  }

  const total = filtered.length;
  const skip = params.skip || 0;
  const limit = params.limit || 20;

  return {
    bookings: filtered.slice(skip, skip + limit),
    total,
  };
};
