import { Booking } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  Globe,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { useState } from 'react';

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (bookingId: string, status: string) => void;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-medium text-xs sm:text-sm break-words mt-0.5">{value}</p>
    </div>
  </div>
);

const BookingDetailsModal = ({
  booking,
  isOpen,
  onClose,
  onStatusUpdate,
}: BookingDetailsModalProps) => {
  const [newStatus, setNewStatus] = useState<string>('');

  if (!booking) return null;

  const handleStatusChange = () => {
    if (newStatus && newStatus !== booking.status) {
      onStatusUpdate(booking._id, newStatus);
      setNewStatus('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto w-[96vw] sm:w-[90vw] p-0">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-background z-10 border-b p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-xl flex items-center gap-3 pr-8">
              <span className="flex-1">Booking Details</span>
              <StatusBadge status={booking.status} className="text-xs" />
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              ID: {booking._id}
            </p>
          </DialogHeader>
          
          {/* Close Button */}
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          {/* Customer Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Customer Info</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/20 rounded-lg p-2">
              <InfoItem icon={User} label="Name" value={booking.name} />
              <InfoItem icon={Mail} label="Email" value={booking.email} />
              <InfoItem 
                icon={Phone} 
                label="Phone" 
                value={`${booking.phone_country} ${booking.phone}`} 
              />
              <InfoItem 
                icon={MapPin} 
                label="Address" 
                value={`${booking.address}, ${booking.pincode}`} 
              />
            </div>
          </div>

          {/* Service Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">Service Info</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/20 rounded-lg p-2">
              <InfoItem icon={Package} label="Service" value={booking.service} />
              <InfoItem icon={Package} label="Package" value={booking.package || 'N/A'} />
              <InfoItem icon={Calendar} label="Date" value={booking.date} />
              <InfoItem icon={Globe} label="Country" value={booking.service_country || 'N/A'} />
            </div>
          </div>

          {/* Message */}
          {booking.message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-sm">Special Message</h3>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs sm:text-sm break-words leading-relaxed">
                  {booking.message}
                </p>
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-sm">Tracking Info</h3>
            </div>
            <div className="bg-muted/20 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {booking.otp_verified ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-xs sm:text-sm">OTP Verified</span>
                </div>
                <Badge variant={booking.otp_verified ? "default" : "secondary"} className="text-xs">
                  {booking.otp_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                    Created
                  </p>
                  <p className="text-xs sm:text-sm font-medium mt-0.5">
                    {format(new Date(booking.created_at), 'MMM d, yyyy • HH:mm')}
                  </p>
                </div>
                {booking.updated_at && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                      Updated
                    </p>
                    <p className="text-xs sm:text-sm font-medium mt-0.5">
                      {format(new Date(booking.updated_at), 'MMM d, yyyy • HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer - Actions */}
        <div className="sticky bottom-0 bg-background border-t p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-full sm:flex-1 h-9 sm:h-10">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || newStatus === booking.status}
              className="gradient-primary text-primary-foreground h-9 sm:h-10 sm:px-6"
            >
              Update Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;