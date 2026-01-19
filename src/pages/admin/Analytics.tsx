import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, TrendingUp, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatsCard from '@/components/dashboard/StatsCard';
import { analyticsApi, bookingsApi } from '@/services/api';
import { Analytics, ServiceAnalytics, MonthlyData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { demoAnalytics, demoServiceData, demoMonthlyData, demoBookings } from '@/data/demoData';

const COLORS = ['#F43F5E', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];

const Analytics_ = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [serviceData, setServiceData] = useState<ServiceAnalytics[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const { toast } = useToast();
  const { isDemo } = useAuth();

  useEffect(() => {
    fetchData();
  }, [isDemo]);

  const fetchData = async () => {
    setIsLoading(true);

    // Use demo data if in demo mode
    if (isDemo) {
      setAnalytics(demoAnalytics);
      setServiceData(demoServiceData);
      setMonthlyData(demoMonthlyData);
      setIsLoading(false);
      return;
    }

    try {
      const [overviewRes, serviceRes, monthlyRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getByService(),
        analyticsApi.getByMonth(),
      ]);
      setAnalytics(overviewRes.data);
      setServiceData(serviceRes.data.services || []);
      setMonthlyData(monthlyRes.data.monthly_data || []);
    } catch (error) {
      // Fall back to demo data
      setAnalytics(demoAnalytics);
      setServiceData(demoServiceData);
      setMonthlyData(demoMonthlyData);
      toast({
        title: 'Using demo data',
        description: 'Could not connect to API. Showing sample data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    let bookings;

    // Use demo data if in demo mode
    if (isDemo) {
      bookings = demoBookings;
    } else {
      try {
        const response = await bookingsApi.search({
          date_from: exportDateFrom || undefined,
          date_to: exportDateTo || undefined,
          limit: 10000,
        });
        bookings = response.data.bookings || response.data || [];
      } catch (error) {
        // Fall back to demo data
        bookings = demoBookings;
      }
    }
    
    if (bookings.length === 0) {
      toast({
        title: 'No data to export',
        description: 'No bookings found for the selected date range.',
      });
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Service', 'Package', 'Date', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...bookings.map((b: any) => [
        b._id,
        `"${b.name}"`,
        b.email,
        b.phone,
        `"${b.service}"`,
        `"${b.package || ''}"`,
        b.date,
        b.status,
        b.created_at,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${bookings.length} bookings to CSV.`,
    });
  };

  const monthlyChartData = monthlyData.map((item) => ({
    name: `${item.year}-${String(item.month).padStart(2, '0')}`,
    bookings: item.count,
  })).reverse();

  const statsCards = [
    {
      title: 'Total Bookings',
      value: analytics?.total_bookings ?? '-',
      icon: Calendar,
      variant: 'primary' as const,
    },
    {
      title: 'Pending',
      value: analytics?.pending_bookings ?? '-',
      icon: Clock,
      variant: 'info' as const,
    },
    {
      title: 'Completed',
      value: analytics?.completed_bookings ?? '-',
      icon: CheckCircle,
      variant: 'success' as const,
    },
    {
      title: 'Cancelled',
      value: analytics?.cancelled_bookings ?? '-',
      icon: XCircle,
      variant: 'warning' as const,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights and trends for your business
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Service */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-6">
            Bookings by Service
          </h2>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : serviceData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="service"
                  label={({ service, count }) => `${service}: ${count}`}
                >
                  {serviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-6">
            Monthly Trends
          </h2>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : monthlyChartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Service Bar Chart */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-6">
          Service Distribution
        </h2>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : serviceData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="service" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Export Data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Download bookings data as a CSV file for the selected date range.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <Input
              type="date"
              value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            <Input
              type="date"
              value={exportDateTo}
              onChange={(e) => setExportDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleExportCSV} className="gradient-primary text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Analytics_;
