import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Filter,
  MoreVertical,
  Search,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { eventsApi } from '@/services/api';
import { Event, EventStatus } from '@/types';
import { toast } from '@/components/ui/use-toast';
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

const Events = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<{
    status?: EventStatus | 'all';
    is_active?: boolean | 'all';
  }>({
    status: 'all',
    is_active: 'all',
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    open: false,
    eventId: null,
    eventTitle: '',
  });

  // Fetch events
  const { 
    data: eventsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['events', page, filter, searchTerm],
    queryFn: () => eventsApi.getAll({ 
      status: filter.status === 'all' ? undefined : filter.status,
      is_active: filter.is_active === 'all' ? undefined : filter.is_active,
      page, 
      limit: 10,
      search: searchTerm || undefined
    }),
    select: (response) => response.data,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Success',
        description: response.data.message,
      });
      setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete event',
        variant: 'destructive',
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => eventsApi.toggleActive(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Success',
        description: response.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update event status',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      eventsApi.updateStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Success',
        description: response.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update event status',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (event: Event) => {
    setDeleteDialog({
      open: true,
      eventId: event._id,
      eventTitle: event.title,
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.eventId) {
      deleteMutation.mutate(deleteDialog.eventId);
    }
  };

  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate(id);
  };

  const handleStatusChange = (id: string, status: EventStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading events...</div>;
  if (error) return <div className="text-red-600 p-8">Error loading events</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
          <p className="text-muted-foreground">
            Create and manage your events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link to="/admin/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search Events</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filter.status || 'all'}
                onValueChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    status: value as EventStatus | 'all',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status Filter */}
            <div className="space-y-2">
              <Label>Active Status</Label>
              <Select
                value={filter.is_active === 'all' ? 'all' : filter.is_active ? 'true' : 'false'}
                onValueChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    is_active: value === 'all' ? 'all' : value === 'true',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilter({ status: 'all', is_active: 'all' });
                  setSearchTerm('');
                }}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <h3 className="text-2xl font-bold">{eventsData?.total || 0}</h3>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <h3 className="text-2xl font-bold">
                  {eventsData?.events?.filter((e: Event) => e.status === 'published').length || 0}
                </h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <h3 className="text-2xl font-bold">
                  {eventsData?.events?.filter((e: Event) => e.status === 'draft').length || 0}
                </h3>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <h3 className="text-2xl font-bold">
                  {eventsData?.events?.filter((e: Event) => e.is_active).length || 0}
                </h3>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            {eventsData?.total || 0} events found • Page {page} of {eventsData?.total_pages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData?.events?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No events found. Create your first event!
                    </TableCell>
                  </TableRow>
                ) : (
                  eventsData?.events?.map((event: Event) => (
                    <TableRow key={event._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {event.main_poster_url ? (
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                              <img
                                src={event.main_poster_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {event.bio.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {formatDate(event.date_from)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(event.time_from)} - {formatTime(event.time_to)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {event.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {event.total_seats}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ₹{event.price_details[0]?.price || 0}
                          {event.price_details.length > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              +{event.price_details.length - 1} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`${getStatusColor(event.status)} w-fit`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(event.status)}
                              {event.status}
                            </span>
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`w-fit cursor-pointer ${event.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}
                            onClick={() => handleToggleActive(event._id)}
                          >
                            {event.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link to={`/admin/events/${event._id}`}>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <Link to={`/admin/events/edit/${event._id}`}>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            {event.status !== 'published' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(event._id, 'published')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {event.status !== 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(event._id, 'draft')}>
                                <Clock className="mr-2 h-4 w-4" />
                                Mark as Draft
                              </DropdownMenuItem>
                            )}
                            {event.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(event._id, 'cancelled')}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(event)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {eventsData?.total_pages && eventsData.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1} to{' '}
                {Math.min(page * 10, eventsData.total)} of {eventsData.total} events
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(eventsData.total_pages, p + 1))}
                  disabled={page === eventsData.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              "{deleteDialog.eventTitle}" and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Events;