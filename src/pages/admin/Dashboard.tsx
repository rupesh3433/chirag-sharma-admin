import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentBookings from '@/components/dashboard/RecentBookings';
import { analyticsApi, bookingsApi } from '@/services/api';
import { Analytics, Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const [analyticsRes, bookingsRes] = await Promise.all([
        analyticsApi.getOverview(),
        bookingsApi.getAll({ limit: 5 }),
      ]);

      setAnalytics(analyticsRes.data);
      setRecentBookings(bookingsRes.data.bookings);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data from server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Bookings',
      value: analytics?.total_bookings ?? '-',
      icon: Calendar,
      variant: 'primary' as const,
      description: 'All time bookings',
    },
    {
      title: 'Pending',
      value: analytics?.pending_bookings ?? '-',
      icon: Clock,
      variant: 'info' as const,
      description: 'Awaiting confirmation',
    },
    {
      title: 'Completed',
      value: analytics?.completed_bookings ?? '-',
      icon: CheckCircle,
      variant: 'success' as const,
      description: 'Successfully done',
    },
    {
      title: "Today's Bookings",
      value: analytics?.today_bookings ?? '-',
      icon: TrendingUp,
      variant: 'warning' as const,
      description: 'Created today',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <div key={card.title} style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard {...card} />
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Recent Bookings
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest customer appointments
            </p>
          </div>
          <Link to="/admin/bookings">
            <Button variant="ghost" className="text-primary hover:text-primary">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <RecentBookings
          bookings={recentBookings}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">OTP Pending</h3>
              <p className="text-sm text-muted-foreground">
                Awaiting verification
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold font-display text-foreground">
            {analytics?.otp_pending ?? '-'}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Last 7 Days</h3>
              <p className="text-sm text-muted-foreground">
                Recent activity
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold font-display text-foreground">
            {analytics?.recent_bookings_7_days ?? '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
