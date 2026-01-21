import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  XCircle,
  RefreshCw,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [analyticsRes, bookingsRes] = await Promise.all([
        analyticsApi.getOverview(),
        bookingsApi.getAll({ limit: 5 }),
      ]);

      setAnalytics(analyticsRes.data);
      setRecentBookings(bookingsRes.data.bookings);

      if (isRefresh) {
        toast({
          title: 'Refreshed',
          description: 'Dashboard data updated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      title: 'Approved',
      value: analytics?.approved_bookings ?? '-',
      icon: CheckCircle,
      variant: 'approved' as const,
      description: 'Confirmed bookings',
    },
    {
      title: 'Completed',
      value: analytics?.completed_bookings ?? '-',
      icon: CheckCircle,
      variant: 'success' as const,
      description: 'Successfully done',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's an overview of your business.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((card, index) => (
          <div key={card.title} style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard {...card} />
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
              Recent Bookings
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Latest {recentBookings.length} customer appointments
            </p>
          </div>
          <Link to="/admin/bookings">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              <span className="hidden sm:inline">View all</span>
              <span className="sm:hidden">All</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6 hover:shadow-card-hover transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm sm:text-base">Last 7 Days</h3>
              <p className="text-xs text-muted-foreground">
                Recent activity
              </p>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            {analytics?.recent_bookings_7_days ?? '-'}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6 hover:shadow-card-hover transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm sm:text-base">Cancelled</h3>
              <p className="text-xs text-muted-foreground">
                Cancelled bookings
              </p>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            {analytics?.cancelled_bookings ?? '-'}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-4 sm:p-6 hover:shadow-card-hover transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm sm:text-base">Today</h3>
              <p className="text-xs text-muted-foreground">
                Created today
              </p>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold font-display text-foreground">
            {analytics?.today_bookings ?? '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;