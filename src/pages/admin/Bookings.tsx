import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, ChevronLeft, ChevronRight, Eye, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/bookings/StatusBadge';
import BookingDetailsModal from '@/components/bookings/BookingDetailsModal';
import { bookingsApi } from '@/services/api';
import { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { filterDemoBookings, demoBookings } from '@/data/demoData';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 20;

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isDemo } = useAuth();

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    // Use demo data if in demo mode
    if (isDemo) {
      const result = filterDemoBookings({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: ITEMS_PER_PAGE,
        skip,
      });
      setBookings(result.bookings);
      setTotalCount(result.total);
      setIsLoading(false);
      return;
    }

    try {
      const response = await bookingsApi.search({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: ITEMS_PER_PAGE,
        skip,
      });
      setBookings(response.data.bookings || response.data || []);
      setTotalCount(response.data.total || response.data.length || 0);
    } catch (error) {
      // Fall back to demo data
      const result = filterDemoBookings({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: ITEMS_PER_PAGE,
        skip,
      });
      setBookings(result.bookings);
      setTotalCount(result.total);
      toast({
        title: 'Using demo data',
        description: 'Could not connect to API. Showing sample data.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, dateFrom, dateTo, toast, isDemo]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBookings();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleViewDetails = async (booking: Booking) => {
    // In demo mode, use the booking directly
    if (isDemo) {
      setSelectedBooking(booking);
      setIsDetailsOpen(true);
      return;
    }

    try {
      const response = await bookingsApi.getById(booking._id);
      setSelectedBooking(response.data);
      setIsDetailsOpen(true);
    } catch (error) {
      // Fall back to the booking we have
      setSelectedBooking(booking);
      setIsDetailsOpen(true);
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteBookingId) return;
    
    if (isDemo) {
      toast({
        title: 'Demo mode',
        description: 'Delete is disabled in demo mode.',
      });
      setDeleteBookingId(null);
      return;
    }

    try {
      await bookingsApi.delete(deleteBookingId);
      toast({
        title: 'Booking deleted',
        description: 'The booking has been successfully deleted.',
      });
      fetchBookings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not delete the booking.',
        variant: 'destructive',
      });
    } finally {
      setDeleteBookingId(null);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (isDemo) {
      toast({
        title: 'Demo mode',
        description: 'Status update is disabled in demo mode.',
      });
      setIsDetailsOpen(false);
      return;
    }

    try {
      await bookingsApi.updateStatus(bookingId, newStatus);
      toast({
        title: 'Status updated',
        description: `Booking status changed to ${newStatus}.`,
      });
      fetchBookings();
      setIsDetailsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not update booking status.',
        variant: 'destructive',
      });
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all customer bookings
          </p>
        </div>
        <Button onClick={fetchBookings} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="otp_pending">OTP Pending</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button onClick={handleSearch} className="gradient-primary text-primary-foreground">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button onClick={handleClearFilters} variant="ghost">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted/50 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-muted-foreground">No bookings found</p>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking._id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">
                      {booking._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-xs text-muted-foreground">{booking.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.service}</TableCell>
                    <TableCell>{booking.package || '-'}</TableCell>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(booking.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteBookingId(booking._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBookingId} onOpenChange={() => setDeleteBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Bookings;
