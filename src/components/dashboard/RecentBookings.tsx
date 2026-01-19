import { Booking } from '@/types';
import StatusBadge from '@/components/bookings/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User } from 'lucide-react';

interface RecentBookingsProps {
  bookings: Booking[];
  isLoading?: boolean;
}

const RecentBookings = ({ bookings, isLoading }: RecentBookingsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No recent bookings</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking, index) => (
        <div
          key={booking._id}
          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{booking.name}</p>
              <p className="text-sm text-muted-foreground">{booking.service}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentBookings;
