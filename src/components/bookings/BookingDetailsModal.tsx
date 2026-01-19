import { Booking } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
  XCircle
} from 'lucide-react';
import { useState } from 'react';

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (bookingId: string, status: string) => void;
}

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
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status & ID */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono font-medium">{booking._id}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{booking.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{booking.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {booking.phone_country} {booking.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{booking.address}, {booking.pincode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Service Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium">{booking.service}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="font-medium">{booking.package || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Date</p>
                  <p className="font-medium">{booking.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Service Country</p>
                  <p className="font-medium">{booking.service_country || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {booking.message && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Special Message
              </h3>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm">{booking.message}</p>
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                {booking.otp_verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-warning" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">OTP Verified</p>
                  <p className="font-medium">{booking.otp_verified ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {format(new Date(booking.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {booking.updated_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="font-medium">
                    {format(new Date(booking.updated_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || newStatus === booking.status}
              className="gradient-primary text-primary-foreground"
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
