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
  Cell,
} from 'recharts';
import {
  Download,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatsCard from '@/components/dashboard/StatsCard';
import { analyticsApi, bookingsApi } from '@/services/api';
import { Analytics, ServiceAnalytics, MonthlyData } from '@/types';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#F43F5E', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [serviceData, setServiceData] = useState<ServiceAnalytics[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const [overviewRes, serviceRes, monthlyRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getByService(),
        analyticsApi.getByMonth(),
      ]);

      setAnalytics(overviewRes.data);
      setServiceData(serviceRes.data.services);
      setMonthlyData(monthlyRes.data.monthly_data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics data from server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await bookingsApi.search({
        date_from: exportDateFrom || undefined,
        date_to: exportDateTo || undefined,
        limit: 10000,
      });

      const bookings = response.data.bookings;

      if (!bookings || bookings.length === 0) {
        toast({
          title: 'No data to export',
          description: 'No bookings found for the selected date range.',
        });
        return;
      }

      const headers = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Service',
        'Package',
        'Date',
        'Status',
        'Created At',
      ];

      const csvContent = [
        headers.join(','),
        ...bookings.map((b: any) =>
          [
            b._id,
            `"${b.name}"`,
            b.email,
            b.phone,
            `"${b.service}"`,
            `"${b.package || ''}"`,
            b.date,
            b.status,
            b.created_at,
          ].join(',')
        ),
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
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export bookings data.',
        variant: 'destructive',
      });
    }
  };

  const monthlyChartData = monthlyData
    .map((item) => ({
      name: `${item.year}-${String(item.month).padStart(2, '0')}`,
      bookings: item.count,
    }))
    .reverse();

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
        <h1 className="font-display text-3xl font-bold text-foreground">
          Analytics
        </h1>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-display text-lg font-semibold mb-6">
            Bookings by Service
          </h2>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">Loading…</div>
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
                >
                  {serviceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-display text-lg font-semibold mb-6">
            Monthly Trends
          </h2>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-display text-lg font-semibold mb-6">
          Service Distribution
        </h2>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Export */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">
          Export Data
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="date"
            value={exportDateFrom}
            onChange={(e) => setExportDateFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={exportDateTo}
            onChange={(e) => setExportDateTo(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleExportCSV} className="gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
