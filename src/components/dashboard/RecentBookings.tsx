import { Booking } from '@/types';
import StatusBadge from '@/components/bookings/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User, Mail, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentBookingsProps {
  bookings: Booking[];
  isLoading?: boolean;
}

const RecentBookings = ({ bookings, isLoading }: RecentBookingsProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 sm:h-20 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-10 sm:py-12 text-muted-foreground">
        <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm sm:text-base">No recent bookings</p>
        <p className="text-xs mt-1">New bookings will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {bookings.map((booking, index) => (
        <div
          key={booking._id}
          onClick={() => navigate('/admin/bookings')}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all cursor-pointer animate-slide-up border border-transparent hover:border-primary/20"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Left side - User info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground text-sm sm:text-base truncate">
                {booking.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {booking.service}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Status and time */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-12 sm:ml-0">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
              </p>
              {booking.date && (
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  📅 {booking.date}
                </p>
              )}
            </div>
            <StatusBadge status={booking.status} className="flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentBookings;