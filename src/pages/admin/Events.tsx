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

  // Fetch all events for stats (no pagination)
  const { data: allEventsData } = useQuery({
    queryKey: ['events', 'stats'],
    queryFn: async () => {
      // Fetch first page to get total count
      const response = await eventsApi.getAll({ page: 1, limit: 100 });
      const total = response.data.total;
      
      // If there are more events, fetch all pages
      if (total > 100) {
        const totalPages = Math.ceil(total / 100);
        const allPages = await Promise.all(
          Array.from({ length: totalPages }, (_, i) => 
            eventsApi.getAll({ page: i + 1, limit: 100 })
          )
        );
        
        // Combine all events
        const allEvents = allPages.flatMap(page => page.data.events);
        return { total, events: allEvents };
      }
      
      return response.data;
    },
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
        return <CheckCircle className="h-3 w-3" />;
      case 'draft':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <X className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
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
    <div className="w-full px-3 sm:px-4 md:px-1 py-3 sm:py-4 md:py-6 space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Events Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create and manage your events
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => refetch()} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link to="/admin/events/create" className="flex-1 sm:flex-none">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-3 sm:pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm">Search Events</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
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
              <Label className="text-sm">Active Status</Label>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Events</p>
                <h3 className="text-xl sm:text-2xl font-bold">{allEventsData?.total || 0}</h3>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Published</p>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {allEventsData?.events?.filter((e: Event) => e.status === 'published').length || 0}
                </h3>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Drafts</p>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {allEventsData?.events?.filter((e: Event) => e.status === 'draft').length || 0}
                </h3>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Events</p>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {allEventsData?.events?.filter((e: Event) => e.is_active).length || 0}
                </h3>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table/Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Events</CardTitle>
          <CardDescription className="text-sm">
            {eventsData?.total || 0} events found • Page {page} of {eventsData?.total_pages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop/Tablet Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Event</TableHead>
                  <TableHead className="w-[15%]">Date & Time</TableHead>
                  <TableHead className="w-[12%]">Location</TableHead>
                  <TableHead className="w-[8%]">Seats</TableHead>
                  <TableHead className="w-[10%]">Price</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[8%] text-right">Actions</TableHead>
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
                      <TableCell className="p-4">
                        <div className="flex items-start gap-3">
                          {event.main_poster_url ? (
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={event.main_poster_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm leading-tight mb-1 break-words">
                              {event.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2 break-words">
                              {event.bio}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium">
                              {formatDate(event.date_from)}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(event.time_from)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-xs line-clamp-2 break-words">
                            {event.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs">{event.total_seats}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-xs font-medium">
                          ₹{event.price_details[0]?.price || 0}
                          {event.price_details.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              +{event.price_details.length - 1} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <Badge className={`${getStatusColor(event.status)} w-fit text-xs px-2 py-0.5`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(event.status)}
                              {event.status}
                            </span>
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`w-fit cursor-pointer text-xs px-2 py-0.5 ${event.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}
                            onClick={() => handleToggleActive(event._id)}
                          >
                            {event.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-4">
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

          {/* Tablet View */}
          <div className="hidden md:block lg:hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Event</TableHead>
                  <TableHead className="w-[20%]">Date</TableHead>
                  <TableHead className="w-[15%]">Seats</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData?.events?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No events found. Create your first event!
                    </TableCell>
                  </TableRow>
                ) : (
                  eventsData?.events?.map((event: Event) => (
                    <TableRow key={event._id}>
                      <TableCell className="p-3">
                        <div className="flex items-start gap-2">
                          {event.main_poster_url ? (
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={event.main_poster_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm leading-tight break-words">
                              {event.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {event.location}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="text-xs">
                          {formatDate(event.date_from)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(event.time_from)}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{event.total_seats}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge className={`${getStatusColor(event.status)} text-xs px-2 py-0.5`}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-3">
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 px-3 pb-3">
            {eventsData?.events?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events found. Create your first event!
              </div>
            ) : (
              eventsData?.events?.map((event: Event) => (
                <Card key={event._id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {event.main_poster_url ? (
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={event.main_poster_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 break-words line-clamp-2">{event.title}</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge className={`${getStatusColor(event.status)} text-xs px-1.5 py-0`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(event.status)}
                              {event.status}
                            </span>
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0 cursor-pointer ${event.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}
                            onClick={() => handleToggleActive(event._id)}
                          >
                            {event.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
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
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs">{formatDate(event.date_from)} • {formatTime(event.time_from)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs line-clamp-1 break-words">{event.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs">{event.total_seats} seats</span>
                        </div>
                        <span className="font-semibold text-sm">
                          ₹{event.price_details[0]?.price || 0}
                          {event.price_details.length > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              +{event.price_details.length - 1}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {eventsData?.total_pages && eventsData.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-3 sm:px-0 gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {(page - 1) * 10 + 1} to{' '}
                {Math.min(page * 10, eventsData.total)} of {eventsData.total} events
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(eventsData.total_pages, p + 1))}
                  disabled={page === eventsData.total_pages}
                  className="flex-1 sm:flex-none"
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
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete the event
              "{deleteDialog.eventTitle}" and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
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