import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Plus, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { eventsApi } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { PriceCategory, Event } from '@/types';
import { LocationPicker } from '@/components/events/LocationPicker';

const EventCreate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [priceCategories, setPriceCategories] = useState<PriceCategory[]>([
    { name: 'General', price: 0, description: '', available_seats: 0 },
  ]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [existingMainPosterUrl, setExistingMainPosterUrl] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    date_from: '',
    date_to: '',
    time_from: '',
    time_to: '',
    location: '',
    location_coords: { lat: 0, lng: 0 },
    total_seats: 0,
    is_active: true,
    status: 'draft' as 'draft' | 'published' | 'cancelled' | 'completed',
  });

  // DON'T auto-fetch location on mount - only when user clicks button

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation. Please enter location manually or use the map.',
        variant: 'destructive',
      });
      return;
    }

    setIsFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData((prev) => ({
          ...prev,
          location_coords: { lat: latitude, lng: longitude },
        }));

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'EventManagementApp/1.0'
              }
            }
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              location: data.display_name,
            }));
            
            toast({
              title: 'Location detected',
              description: 'Your current location has been set.',
            });
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          toast({
            title: 'Location detected',
            description: 'Coordinates set. Please enter the address manually.',
          });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Could not get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions or use the map picker.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please use the map picker.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please use the map picker.';
            break;
        }
        
        toast({
          title: 'Location detection failed',
          description: errorMessage,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Fetch event data if in edit mode
  const { data: existingEventResponse, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
    select: (response) => response.data,
  });

  // Update form data when existing event is fetched
  useEffect(() => {
    if (existingEventResponse && id) {
      const event = existingEventResponse;
      
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        title: event.title,
        bio: event.bio,
        date_from: formatDateForInput(event.date_from),
        date_to: formatDateForInput(event.date_to),
        time_from: event.time_from,
        time_to: event.time_to,
        location: event.location,
        location_coords: event.location_coords || { lat: 0, lng: 0 },
        total_seats: event.total_seats,
        is_active: event.is_active,
        status: event.status,
      });
      
      setPriceCategories(event.price_details || []);
      setExistingGalleryUrls(event.gallery_images || []);
      setExistingMainPosterUrl(event.main_poster_url || '');
    }
  }, [existingEventResponse, id]);

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (formDataToSend: FormData) => {
      return await eventsApi.create(formDataToSend);
    },
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: response.data.message,
      });
      navigate('/admin/events');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create event',
        variant: 'destructive',
      });
    },
  });

  // Update event mutation - NOW SUPPORTS FILE UPLOAD
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      return await eventsApi.updateWithFiles(id, data);
    },
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: response.message,
      });
      navigate('/admin/events');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (index: number, field: keyof PriceCategory, value: string | number) => {
    const updated = [...priceCategories];
    let newValue: any = value;
    
    if (field === 'price' || field === 'available_seats') {
      if (value === '') {
        newValue = 0;
      } else if (typeof value === 'string') {
        const numValue = Number(value);
        newValue = isNaN(numValue) ? 0 : numValue;
      }
    }
    
    updated[index] = { ...updated[index], [field]: newValue };
    setPriceCategories(updated);
  };

  const addPriceCategory = () => {
    setPriceCategories([
      ...priceCategories,
      { name: '', price: 0, description: '', available_seats: 0 },
    ]);
  };

  const removePriceCategory = (index: number) => {
    if (priceCategories.length > 1) {
      const updated = priceCategories.filter((_, i) => i !== index);
      setPriceCategories(updated);
    }
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainImage(e.target.files[0]);
      // Clear existing poster URL when new image is selected
      if (isEditMode) {
        setExistingMainPosterUrl('');
      }
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGalleryImages((prev) => [...prev, ...files]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (index: number) => {
    setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMainImage = () => {
    setMainImage(null);
    setExistingMainPosterUrl('');
  };

  const handleLocationSelect = (coords: { lat: number; lng: number }, address?: string) => {
    setFormData((prev) => ({
      ...prev,
      location_coords: coords,
      location: address || prev.location,
    }));
    
    toast({
      title: 'Location updated',
      description: address ? 'Location selected from map' : 'Coordinates updated',
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.bio || !formData.date_from || !formData.date_to) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!isEditMode && !mainImage) {
      toast({
        title: 'Error',
        description: 'Please upload a main poster image',
        variant: 'destructive',
      });
      return;
    }

    if (priceCategories.length === 0 || priceCategories.some(pc => !pc.name || pc.price < 0)) {
      toast({
        title: 'Error',
        description: 'Please fill all price categories properly',
        variant: 'destructive',
      });
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append(
      'event_data',
      JSON.stringify({
        ...formData,
        price_details: priceCategories,
        gallery_images: existingGalleryUrls,
        main_poster_url: existingMainPosterUrl,
      })
    );

    // Add main poster if new one is selected
    if (mainImage) {
      submitFormData.append('main_poster', mainImage);
    }

    // Add new gallery images
    galleryImages.forEach((image) => {
      submitFormData.append('gallery_images', image);
    });

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: submitFormData });
    } else {
      createMutation.mutate(submitFormData);
    }
  };

  if (isEditMode && isLoadingEvent) {
    return <div className="flex justify-center p-8">Loading event...</div>;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4 md:mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/events')} size="sm" className="sm:size-default">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isEditMode ? 'Update your event details' : 'Fill in the details for your new event'}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-2 sm:gap-4 mb-6 md:mb-8 overflow-x-auto pb-2">
        <Button
          variant={step === 1 ? 'default' : 'outline'}
          onClick={() => setStep(1)}
          size="sm"
          className="flex-shrink-0"
        >
          1. Basic Info
        </Button>
        <Button
          variant={step === 2 ? 'default' : 'outline'}
          onClick={() => setStep(2)}
          size="sm"
          className="flex-shrink-0"
        >
          2. Details & Pricing
        </Button>
        <Button
          variant={step === 3 ? 'default' : 'outline'}
          onClick={() => setStep(3)}
          size="sm"
          className="flex-shrink-0"
        >
          3. Images
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Event Details & Pricing'}
            {step === 3 && 'Images & Media'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">Event Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_seats" className="text-sm">Total Seats *</Label>
                  <Input
                    id="total_seats"
                    name="total_seats"
                    type="number"
                    min="0"
                    value={formData.total_seats === 0 ? '' : formData.total_seats}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ 
                        ...prev, 
                        total_seats: value === '' ? 0 : Number(value) 
                      }));
                    }}
                    placeholder="Enter total seats"
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.value = '';
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.value = '0';
                        setFormData((prev) => ({ ...prev, total_seats: 0 }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm">Event Description *</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Describe your event..."
                  rows={4}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_from" className="text-sm">Start Date *</Label>
                  <Input
                    id="date_from"
                    name="date_from"
                    type="date"
                    value={formData.date_from}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_to" className="text-sm">End Date *</Label>
                  <Input
                    id="date_to"
                    name="date_to"
                    type="date"
                    value={formData.date_to}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time_from" className="text-sm">Start Time *</Label>
                  <Input
                    id="time_from"
                    name="time_from"
                    type="time"
                    value={formData.time_from}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_to" className="text-sm">End Time *</Label>
                  <Input
                    id="time_to"
                    name="time_to"
                    type="time"
                    value={formData.time_to}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Details & Pricing */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm">Location *</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter event venue address"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      currentLocation={formData.location}
                      currentCoords={formData.location_coords}
                      buttonText="Select on Map"
                    />
                    <Button 
                      type="button" 
                      onClick={fetchCurrentLocation} 
                      variant="outline"
                      disabled={isFetchingLocation}
                      className="w-full sm:w-auto"
                    >
                      {isFetchingLocation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Use My Location
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {formData.location_coords.lat !== 0 && formData.location_coords.lng !== 0 && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Coordinates: {formData.location_coords.lat.toFixed(6)}, {formData.location_coords.lng.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Price Categories *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPriceCategory}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Category</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>

                {priceCategories.map((category, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3 sm:p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm">Category Name *</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => handlePriceChange(index, 'name', e.target.value)}
                        placeholder="e.g., VIP, Basic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Price (₹) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={category.price === 0 ? '' : category.price}
                        onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                        placeholder="0"
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Available Seats</Label>
                      <Input
                        type="number"
                        min="0"
                        value={category.available_seats === 0 ? '' : category.available_seats}
                        onChange={(e) => handlePriceChange(index, 'available_seats', e.target.value)}
                        placeholder="0"
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Description</Label>
                      <Input
                        value={category.description || ''}
                        onChange={(e) => handlePriceChange(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                      />
                    </div>
                    {priceCategories.length > 1 && (
                      <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePriceCategory(index)}
                          className="text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <Label className="text-sm">Main Poster Image {!isEditMode && '*'}</Label>
                <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center">
                  {mainImage || existingMainPosterUrl ? (
                    <div className="space-y-4">
                      <div className="w-full bg-gray-50 rounded-lg p-4">
                        <img
                          src={mainImage ? URL.createObjectURL(mainImage) : existingMainPosterUrl}
                          alt="Preview"
                          className="w-full h-auto mx-auto max-w-lg"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={removeMainImage}
                          className="text-red-600"
                          type="button"
                          size="sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove Image
                        </Button>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                          className="hidden"
                          id="change-main-image"
                        />
                        <Label htmlFor="change-main-image">
                          <Button asChild variant="outline" type="button" size="sm">
                            <span>Change Image</span>
                          </Button>
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm sm:text-base">Upload main poster image</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        JPG/PNG (Max 10MB) - Scaled to max 1920px width, aspect ratio preserved
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="hidden"
                        id="main-image"
                      />
                      <Label htmlFor="main-image">
                        <Button asChild variant="outline" className="mt-4" type="button" size="sm">
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm">Gallery Images (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center">
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm sm:text-base">Upload gallery images</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Multiple images allowed (Max 10MB each) - Scaled to max 1920px width, aspect ratios preserved
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                    id="gallery-images"
                    multiple
                  />
                  <Label htmlFor="gallery-images">
                    <Button asChild variant="outline" className="mt-4" type="button" size="sm">
                      <span>Choose Files</span>
                    </Button>
                  </Label>
                </div>

                {/* Gallery preview */}
                {(galleryImages.length > 0 || existingGalleryUrls.length > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                    {existingGalleryUrls.map((image, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <div className="w-full bg-gray-50 rounded-lg p-2">
                          <img
                            src={image}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-auto"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeExistingGalleryImage(index)}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {galleryImages.map((image, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="w-full bg-gray-50 rounded-lg p-2">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-auto"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 mt-6 sm:mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} type="button" className="w-full sm:w-auto">
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="w-full sm:w-auto sm:ml-auto" type="button">
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:ml-auto"
                type="button"
              >
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Event' : 'Create Event')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventCreate;