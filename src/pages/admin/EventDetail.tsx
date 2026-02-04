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

  if (isLoading) return <div className="flex justify-center p-8">Loading event...</div>;
  if (error || !eventResponse) return <div className="text-red-600 p-8">Event not found</div>;

  const event = eventResponse;
  const allImages = [event.main_poster_url, ...(event.gallery_images || [])];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/events')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              {event.is_active ? (
                <Badge variant="outline" className="bg-green-50">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/admin/events/edit/${event._id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image - FULL SIZE WITHOUT CROPPING */}
          <Card>
            <CardContent className="p-6">
              {allImages.length > 0 ? (
                <div className="w-full bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={allImages[activeImage]}
                    alt={event.title}
                    className="w-full h-auto object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                  <ImageIcon className="h-24 w-24 text-gray-400" />
                </div>
              )}

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="mt-4 grid grid-cols-6 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center p-1 ${
                        activeImage === index ? 'ring-2 ring-primary' : ''
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
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{event.bio}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Date & Time</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.date_from).toLocaleDateString()} -{' '}
                    {new Date(event.date_to).toLocaleDateString()}
                  </div>
                  <div className="text-sm">
                    {event.time_from} - {event.time_to}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm">{event.location}</div>
                  {event.location_coords && (
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {event.location_coords.lat?.toFixed(6) || 'N/A'},{' '}
                      {event.location_coords.lng?.toFixed(6) || 'N/A'}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Seating</div>
                  <div className="text-sm">
                    Total Seats: {event.total_seats}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Price Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {event.price_details?.map((category, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground">
                          {category.description}
                        </div>
                      )}
                      {category.available_seats !== undefined && (
                        <div className="text-sm">
                          {category.available_seats} seats available
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-bold">₹{category.price}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span>{event.created_by}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At</span>
                <span>{new Date(event.created_at).toLocaleString()}</span>
              </div>
              {event.updated_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated At</span>
                  <span>{new Date(event.updated_at).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;