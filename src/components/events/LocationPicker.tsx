import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Fix for leaflet marker icons in Vite/React
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (coords: { lat: number; lng: number }, address?: string) => void;
  currentLocation?: string;
  currentCoords?: { lat: number; lng: number };
  buttonText?: string;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Function component for map click handling
function MapClickHandler({ onMarkerChange }: { onMarkerChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMarkerChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  currentLocation = '',
  currentCoords,
  buttonText = 'Select on Map',
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Initialize with current coords or default fallback
  const getInitialCoords = () => {
    if (currentCoords && currentCoords.lat !== 0 && currentCoords.lng !== 0) {
      return currentCoords;
    }
    // Default to Kathmandu only as fallback
    return { lat: 27.7172, lng: 85.3240 };
  };

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>(getInitialCoords());
  const [address, setAddress] = useState(currentLocation);
  const [center, setCenter] = useState<[number, number]>(() => {
    const coords = getInitialCoords();
    return [coords.lat, coords.lng];
  });
  const mapRef = useRef<any>(null);

  // Update internal state when currentCoords prop changes
  useEffect(() => {
    if (currentCoords && currentCoords.lat !== 0 && currentCoords.lng !== 0) {
      setSelectedLocation(currentCoords);
      setCenter([currentCoords.lat, currentCoords.lng]);
    }
  }, [currentCoords]);

  // Update address when currentLocation prop changes
  useEffect(() => {
    if (currentLocation) {
      setAddress(currentLocation);
    }
  }, [currentLocation]);

  // Search for locations using OpenStreetMap Nominatim
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    searchLocation(searchQuery);
  };

  const handleSelectResult = (result: SearchResult) => {
    const newCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setSelectedLocation(newCoords);
    setCenter([newCoords.lat, newCoords.lng]);
    setAddress(result.display_name);
    
    // Update map view
    if (mapRef.current) {
      mapRef.current.setView([newCoords.lat, newCoords.lng], 13);
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const newCoords = { lat, lng };
    setSelectedLocation(newCoords);
    
    // Reverse geocode to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        const newAddress = data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        setAddress(newAddress);
      })
      .catch(() => {
        setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      });
  };

  const handleConfirm = () => {
    // Pass the selected coordinates and address back to parent
    onLocationSelect(selectedLocation, address);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <MapPin className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Location on Map</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="font-medium text-sm">{result.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative min-h-[400px]">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
              ref={mapRef}
              key={`${center[0]}-${center[1]}`} // Force re-render when center changes
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
              <MapClickHandler onMarkerChange={handleMapClick} />
            </MapContainer>
          </div>

          {/* Selected Location Info */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Location:</div>
            <div className="text-sm text-gray-600">
              {address || `Latitude: ${selectedLocation.lat.toFixed(6)}, Longitude: ${selectedLocation.lng.toFixed(6)}`}
            </div>
            <div className="text-xs text-gray-500">
              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};