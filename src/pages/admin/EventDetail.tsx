import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Edit,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { eventsApi } from '@/services/api';
import { Event } from '@/types';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);

  const { data: eventResponse, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
    select: (response) => response.data,
  });

  const getStatusColor = (status: string) => {
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

  if (isLoading) return <div className="flex justify-center p-8">Loading event...</div>;
  if (error || !eventResponse) return <div className="text-red-600 p-8">Event not found</div>;

  const event = eventResponse;
  const allImages = [event.main_poster_url, ...(event.gallery_images || [])].filter(Boolean);

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Back Button Row */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/events')} 
            size="sm"
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button 
              onClick={() => navigate(`/admin/events/edit/${event._id}`)} 
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        {/* Title and Badges */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words mb-2">
            {event.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getStatusColor(event.status)} text-xs`}>
              {event.status}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${event.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}
            >
              {event.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Left Column - Images and Description */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Main Image */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {allImages.length > 0 ? (
                <div className="w-full bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={allImages[activeImage]}
                    alt={event.title}
                    className="w-full h-auto object-contain mx-auto max-h-[300px] sm:max-h-[400px] md:max-h-[500px]"
                  />
                </div>
              ) : (
                <div className="w-full h-48 sm:h-64 md:h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                  <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24 text-gray-400" />
                </div>
              )}

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="mt-3 sm:mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center p-0.5 sm:p-1 transition-all ${
                        activeImage === index ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Description */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed break-words">
                {event.bio}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              {/* Date & Time */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base">Date & Time</div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    {formatDate(event.date_from)} - {formatDate(event.date_to)}
                  </div>
                  <div className="text-xs sm:text-sm">
                    {event.time_from} - {event.time_to}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base">Location</div>
                  <div className="text-xs sm:text-sm break-words">{event.location}</div>
                  {event.location_coords && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.location_coords.lat?.toFixed(6) || 'N/A'}, {event.location_coords.lng?.toFixed(6) || 'N/A'}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Seating */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm sm:text-base">Seating</div>
                  <div className="text-xs sm:text-sm">
                    Total Seats: {event.total_seats}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Categories */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">Price Categories</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 sm:space-y-3">
                {event.price_details?.map((category, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start gap-3 p-2 sm:p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base break-words">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-xs sm:text-sm text-muted-foreground break-words mt-0.5">
                          {category.description}
                        </div>
                      )}
                      {category.available_seats !== undefined && (
                        <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {category.available_seats} seats available
                        </div>
                      )}
                    </div>
                    <div className="text-base sm:text-lg md:text-xl font-bold flex-shrink-0">
                      ₹{category.price}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm pt-0">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-muted-foreground font-medium">Created By</span>
                <span className="break-words">{event.created_by}</span>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-muted-foreground font-medium">Created At</span>
                <span className="break-words">
                  {new Date(event.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              {event.updated_at && (
                <>
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-muted-foreground font-medium">Updated At</span>
                    <span className="break-words">
                      {new Date(event.updated_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;