import { cn } from '@/lib/utils';
import { Booking } from '@/types';

interface StatusBadgeProps {
  status: Booking['status'];
  className?: string;
}

const statusConfig = {
  otp_pending: {
    label: 'OTP Pending',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-info/10 text-info border-info/20',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success/10 text-success border-success/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;