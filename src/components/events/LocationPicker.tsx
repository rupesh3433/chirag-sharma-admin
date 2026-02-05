import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Loader2, Building2, MapPinned, Hotel, Landmark, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

interface UnifiedSearchResult {
  lat: number;
  lng: number;
  display_name: string;
  type?: string;
  source: 'photon' | 'opentripmap' | 'nominatim' | 'openmeteo' | 'overpass' | 'pelias' | 'geonames';
  confidence: number;
  category?: string;
  importance?: number;
  distance?: number;
}

interface QueryIntent {
  type: 'poi' | 'address' | 'city' | 'nearby' | 'landmark';
  keywords: string[];
  isPOI: boolean;
  isAddress: boolean;
  isCity: boolean;
}

// Component to handle map click events
function MapClickHandler({ onMarkerChange }: { onMarkerChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMarkerChange(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMarkerChange]);
  
  return null;
}

// Component to update map center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  
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
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState<{ lat: number; lng: number } | null>(null);
  const searchCacheRef = useRef<Map<string, UnifiedSearchResult[]>>(new Map());
  const searchContainerRef = useRef<HTMLFormElement>(null);
  
  // Get API key from environment
  const OPENTRIPMAP_API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY || '';
  
  // Initialize with current coords or default to Kathmandu
  const getInitialCoords = () => {
    if (currentCoords && currentCoords.lat !== 0 && currentCoords.lng !== 0) {
      return currentCoords;
    }
    return { lat: 27.7172, lng: 85.3240 };
  };

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>(getInitialCoords());
  const [address, setAddress] = useState(currentLocation);

  useEffect(() => {
    if (currentCoords && currentCoords.lat !== 0 && currentCoords.lng !== 0) {
      setSelectedLocation(currentCoords);
      setAddress(currentLocation);
    }
  }, [currentCoords, currentLocation]);

  useEffect(() => {
    if (open) {
      const coords = getInitialCoords();
      setSelectedLocation(coords);
      setAddress(currentLocation);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🧠 QUERY INTENT DETECTION (Google-like intelligence)
  const detectIntent = (query: string): QueryIntent => {
    const lowerQuery = query.toLowerCase();
    
    // 🔥 MASSIVELY ENHANCED POI KEYWORDS (Most comprehensive list)
    const poiKeywords = [
      // Accommodation
      'hotel', 'resort', 'inn', 'lodge', 'motel', 'hostel', 'guesthouse', 'guest house',
      'bed and breakfast', 'bnb', 'cottage', 'villa', 'apartment', 'airbnb', 'homestay',
      'camping', 'campsite', 'resort hotel', 'beach resort', 'mountain resort',
      
      // Food & Drink
      'restaurant', 'cafe', 'coffee', 'bar', 'pub', 'bistro', 'diner', 'eatery',
      'food court', 'canteen', 'cafeteria', 'bakery', 'pizzeria', 'steakhouse',
      'fast food', 'buffet', 'lounge', 'nightclub', 'brewery', 'winery',
      
      // Shopping
      'mall', 'shopping center', 'shopping centre', 'market', 'supermarket', 'store',
      'shop', 'boutique', 'plaza', 'arcade', 'bazaar', 'outlet', 'showroom',
      
      // Healthcare
      'hospital', 'clinic', 'medical center', 'pharmacy', 'doctor', 'dentist',
      'health center', 'dispensary', 'nursing home', 'medical clinic',
      
      // Education
      'school', 'college', 'university', 'institute', 'academy', 'library',
      'training center', 'coaching center', 'kindergarten', 'preschool',
      
      // Entertainment & Recreation
      'park', 'garden', 'stadium', 'arena', 'theater', 'theatre', 'cinema',
      'multiplex', 'museum', 'gallery', 'zoo', 'aquarium', 'amusement park',
      'theme park', 'water park', 'playground', 'sports complex', 'gym',
      'fitness center', 'spa', 'salon', 'swimming pool', 'club',
      
      // Transportation
      'airport', 'station', 'railway station', 'train station', 'bus station',
      'metro station', 'subway', 'terminal', 'depot', 'taxi stand', 'parking',
      
      // Religious & Cultural
      'temple', 'church', 'mosque', 'gurudwara', 'monastery', 'shrine',
      'cathedral', 'chapel', 'synagogue', 'pagoda',
      
      // Services
      'bank', 'atm', 'post office', 'police station', 'fire station',
      'government office', 'embassy', 'consulate', 'court', 'office',
      
      // Landmarks & Attractions
      'monument', 'memorial', 'tower', 'fort', 'palace', 'castle',
      'heritage site', 'tourist spot', 'viewpoint', 'landmark', 'attraction',
      'beach', 'lake', 'river', 'waterfall', 'hill station', 'valley',
      
      // Events & Venues
      'convention center', 'conference hall', 'banquet hall', 'auditorium',
      'event venue', 'marriage hall', 'wedding venue', 'party hall',
      
      // Specific Business Types
      'petrol pump', 'gas station', 'car wash', 'garage', 'workshop',
      'salon', 'barber', 'laundry', 'dry cleaning', 'tailor',
    ];
    
    // Address keywords
    const addressKeywords = ['road', 'street', 'nagar', 'colony', 'sector', 'block', 
                             'avenue', 'lane', 'plaza', 'tower', 'building', 'house',
                             'flat', 'apartment', 'society', 'enclave', 'extension',
                             'vihar', 'puram', 'ganj', 'chowk', 'circle'];
    
    const isPOI = poiKeywords.some(kw => lowerQuery.includes(kw));
    const isAddress = addressKeywords.some(kw => lowerQuery.includes(kw)) || /\d+/.test(query);
    const isCity = query.split(' ').length <= 2 && !isPOI && !isAddress;
    
    let type: QueryIntent['type'] = 'city';
    if (isPOI) type = 'poi';
    else if (isAddress) type = 'address';
    else if (lowerQuery.includes('near') || lowerQuery.includes('around')) type = 'nearby';
    
    return {
      type,
      keywords: poiKeywords.filter(kw => lowerQuery.includes(kw)),
      isPOI,
      isAddress,
      isCity,
    };
  };

  // 🔥 STRING SIMILARITY (for ranking) - Enhanced to prioritize exact and starts-with matches
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Perfect exact match
    if (s1 === s2) return 1.0;
    
    // Exact word match (highest priority after exact match)
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    if (words1.some(w1 => words2.some(w2 => w1 === w2 && w1.length > 2))) {
      return 0.95;
    }
    
    // Starts with match (very high priority)
    if (s1.startsWith(s2) || s2.startsWith(s1)) return 0.92;
    
    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;
    
    // Word-level starts with
    if (words1.some(w1 => words2.some(w2 => w1.startsWith(w2) || w2.startsWith(w1)))) {
      return 0.80;
    }
    
    // Levenshtein distance (simplified)
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = calculateEditDistance(longer, shorter);
    return Math.max(0, (longer.length - editDistance) / longer.length);
  };

  const calculateEditDistance = (s1: string, s2: string): number => {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  // 🧮 DYNAMIC CONFIDENCE SCORING (Google-like ranking) - Enhanced for exact matches
  const calculateDynamicScore = (
    result: UnifiedSearchResult,
    query: string,
    intent: QueryIntent
  ): number => {
    let score = 0;
    
    // 1. Name similarity (50% weight - increased for exact matches)
    const nameSimilarity = calculateSimilarity(query, result.display_name);
    
    // Extra boost for very high similarity (exact/near-exact matches)
    if (nameSimilarity >= 0.90) {
      score += nameSimilarity * 0.55; // Extra weight for exact matches
    } else {
      score += nameSimilarity * 0.45;
    }
    
    // 2. Source reliability (18% weight)
    const sourceWeights = {
      photon: 0.95,
      pelias: 0.90,
      opentripmap: 0.88,
      overpass: 0.85,
      nominatim: 0.75,
      geonames: 0.70,
      openmeteo: 0.65,
    };
    score += (sourceWeights[result.source] || 0.5) * 0.18;
    
    // 3. Category relevance (20% weight)
    let categoryMatch = 0;
    if (intent.isPOI && (result.category === 'poi' || result.type?.includes('hotel') || result.type?.includes('resort'))) {
      categoryMatch = 1.0;
    } else if (intent.isAddress && result.category === 'address') {
      categoryMatch = 1.0;
    } else if (intent.isCity && result.category === 'city') {
      categoryMatch = 1.0;
    } else {
      categoryMatch = 0.5;
    }
    score += categoryMatch * 0.20;
    
    // 4. Distance from last searched city (7% weight) - geo bias
    if (lastSearchedCity && result.distance !== undefined) {
      const distanceScore = Math.max(0, 1 - (result.distance / 50000)); // 50km max
      score += distanceScore * 0.07;
    } else {
      score += 0.035; // neutral
    }
    
    // 5. Importance/popularity (5% weight)
    if (result.importance !== undefined) {
      score += result.importance * 0.05;
    }
    
    return Math.min(score, 1.0);
  };

  // 🌟 1. PHOTON API - Primary fuzzy search
  const searchPhoton = async (query: string): Promise<UnifiedSearchResult[]> => {
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`
      );
      
      if (!response.ok) throw new Error('Photon search failed');
      
      const data = await response.json();
      
      return (data.features || []).map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        display_name: feature.properties.name 
          ? `${feature.properties.name}${feature.properties.city ? ', ' + feature.properties.city : ''}${feature.properties.country ? ', ' + feature.properties.country : ''}`
          : feature.properties.city || feature.properties.state || 'Unknown',
        type: feature.properties.type || feature.properties.osm_value,
        source: 'photon' as const,
        confidence: 0.9,
        category: feature.properties.osm_key,
      }));
    } catch (error) {
      console.error('Photon API error:', error);
      return [];
    }
  };

  // 🗺️ 2. PELIAS API - Advanced geocoder
  const searchPelias = async (query: string): Promise<UnifiedSearchResult[]> => {
    try {
      // Using public Pelias instance
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
      );
      
      if (!response.ok) throw new Error('Pelias search failed');
      
      const data = await response.json();
      
      return (data.features || []).map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        display_name: feature.properties.name || feature.properties.label || 'Unknown',
        type: feature.properties.layer,
        source: 'pelias' as const,
        confidence: 0.88,
        category: feature.properties.layer,
      }));
    } catch (error) {
      console.error('Pelias API error:', error);
      return [];
    }
  };

  // 🏨 3. OPENTRIPMAP API - POI enrichment
  const searchOpenTripMap = async (query: string, lat: number, lng: number): Promise<UnifiedSearchResult[]> => {
    if (!OPENTRIPMAP_API_KEY) {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${lng}&lat=${lat}&kinds=accomodations,interesting_places,tourist_facilities&limit=10&apikey=${OPENTRIPMAP_API_KEY}`
      );
      
      if (!response.ok) throw new Error('OpenTripMap search failed');
      
      const data = await response.json();
      
      const poiResults: UnifiedSearchResult[] = [];
      
      for (const poi of (data.features || []).slice(0, 5)) {
        try {
          const detailResponse = await fetch(
            `https://api.opentripmap.com/0.1/en/places/xid/${poi.properties.xid}?apikey=${OPENTRIPMAP_API_KEY}`
          );
          
          if (detailResponse.ok) {
            const details = await detailResponse.json();
            
            poiResults.push({
              lat: poi.geometry.coordinates[1],
              lng: poi.geometry.coordinates[0],
              display_name: poi.properties.name || details.name || 'Unnamed Place',
              type: details.kinds || poi.properties.kinds,
              source: 'opentripmap' as const,
              confidence: 0.85,
              category: 'poi',
            });
          }
        } catch (err) {
          // Skip this POI
        }
      }
      
      return poiResults;
    } catch (error) {
      console.error('OpenTripMap API error:', error);
      return [];
    }
  };

  // 🔥 4. OVERPASS API - Deep OSM POI search (nuclear weapon) - MASSIVELY ENHANCED
  const searchOverpass = async (query: string, lat: number, lng: number): Promise<UnifiedSearchResult[]> => {
    try {
      const intent = detectIntent(query);
      const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
      const mainTerm = searchTerms[0] || query;
      
      // Build comprehensive Overpass query based on intent
      let overpassQuery = '[out:json][timeout:8];(';
      
      if (intent.isPOI) {
        // 🔥 COMPREHENSIVE POI SEARCH - Covers ALL common POI types
        overpassQuery += `
          node["tourism"~"hotel|resort|guest_house|motel|hostel|apartment|chalet|camp_site"](around:8000,${lat},${lng});
          way["tourism"~"hotel|resort|guest_house|motel|hostel"](around:8000,${lat},${lng});
          
          node["amenity"~"restaurant|cafe|fast_food|bar|pub|food_court|ice_cream|biergarten"](around:8000,${lat},${lng});
          node["amenity"~"hospital|clinic|pharmacy|doctors|dentist|veterinary"](around:8000,${lat},${lng});
          node["amenity"~"school|college|university|library|kindergarten"](around:8000,${lat},${lng});
          node["amenity"~"bank|atm|post_office|police|fire_station|courthouse"](around:8000,${lat},${lng});
          node["amenity"~"fuel|parking|car_wash|bicycle_parking|charging_station"](around:8000,${lat},${lng});
          node["amenity"~"place_of_worship|community_centre|social_facility"](around:8000,${lat},${lng});
          node["amenity"~"cinema|theatre|nightclub|casino|arts_centre"](around:8000,${lat},${lng});
          
          node["shop"~"mall|supermarket|convenience|department_store|clothes|electronics"](around:8000,${lat},${lng});
          node["shop"~"beauty|hairdresser|jewelry|bakery|books|furniture"](around:8000,${lat},${lng});
          
          node["leisure"~"park|garden|playground|sports_centre|stadium|swimming_pool|fitness_centre"](around:8000,${lat},${lng});
          node["leisure"~"water_park|golf_course|marina|beach_resort|amusement_arcade"](around:8000,${lat},${lng});
          
          node["sport"~"swimming|tennis|soccer|basketball|cricket|badminton|gym"](around:8000,${lat},${lng});
          
          node["building"~"hotel|commercial|retail|hospital|school|university|government"](around:8000,${lat},${lng});
          
          node["office"~"government|company|insurance|estate_agent|lawyer|accountant"](around:8000,${lat},${lng});
          
          way["amenity"](around:8000,${lat},${lng});
          way["shop"](around:8000,${lat},${lng});
          way["leisure"](around:8000,${lat},${lng});
        `;
        
        // Add name-based search if we have specific terms
        if (mainTerm && mainTerm.length > 2) {
          overpassQuery += `
            node["name"~"${mainTerm}",i](around:10000,${lat},${lng});
            way["name"~"${mainTerm}",i](around:10000,${lat},${lng});
          `;
        }
      } else {
        // General name-based search for non-POI queries
        if (mainTerm && mainTerm.length > 2) {
          overpassQuery += `
            node["name"~"${mainTerm}",i](around:15000,${lat},${lng});
            way["name"~"${mainTerm}",i](around:15000,${lat},${lng});
            node["place"~"city|town|village|hamlet|suburb|neighbourhood"](around:15000,${lat},${lng});
          `;
        }
      }
      
      overpassQuery += ');out center 20;';
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      });
      
      if (!response.ok) throw new Error('Overpass search failed');
      
      const data = await response.json();
      
      return (data.elements || []).map((element: any) => {
        const lat = element.lat || element.center?.lat || 0;
        const lng = element.lon || element.center?.lon || 0;
        const name = element.tags?.name || element.tags?.brand || 'Unknown';
        
        // Build rich display name
        let displayName = name;
        if (element.tags?.['addr:city']) {
          displayName += ', ' + element.tags['addr:city'];
        } else if (element.tags?.['addr:state']) {
          displayName += ', ' + element.tags['addr:state'];
        }
        
        // Determine type
        const type = element.tags?.tourism || 
                    element.tags?.amenity || 
                    element.tags?.shop || 
                    element.tags?.leisure || 
                    element.tags?.sport ||
                    element.tags?.office ||
                    element.tags?.building ||
                    'place';
        
        return {
          lat,
          lng,
          display_name: displayName,
          type,
          source: 'overpass' as const,
          confidence: 0.82,
          category: 'poi',
        };
      }).filter((r: UnifiedSearchResult) => r.lat !== 0 && r.lng !== 0);
    } catch (error) {
      console.error('Overpass API error:', error);
      return [];
    }
  };

  // 📍 5. NOMINATIM API - Administrative fallback
  const searchNominatim = async (query: string): Promise<UnifiedSearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`,
        {
          headers: { 'User-Agent': 'EventManagementApp/1.0' }
        }
      );
      
      if (!response.ok) throw new Error('Nominatim search failed');
      
      const data = await response.json();
      
      return (data || []).map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
        type: item.type,
        source: 'nominatim' as const,
        confidence: 0.7,
        category: item.class === 'place' ? 'city' : item.class,
        importance: parseFloat(item.importance || 0),
      }));
    } catch (error) {
      console.error('Nominatim API error:', error);
      return [];
    }
  };

  // 🌍 6. OPEN-METEO API - City-level safety net
  const searchOpenMeteo = async (query: string): Promise<UnifiedSearchResult[]> => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      
      if (!response.ok) throw new Error('Open-Meteo search failed');
      
      const data = await response.json();
      
      return (data.results || []).map((item: any) => ({
        lat: item.latitude,
        lng: item.longitude,
        display_name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country ? ', ' + item.country : ''}`,
        type: item.feature_code,
        source: 'openmeteo' as const,
        confidence: 0.6,
        category: 'city',
      }));
    } catch (error) {
      console.error('Open-Meteo API error:', error);
      return [];
    }
  };

  // 🗺️ 7. GEONAMES API - Global cities and places
  const searchGeoNames = async (query: string): Promise<UnifiedSearchResult[]> => {
    try {
      // Using GeoNames free service (no API key needed for basic search)
      const response = await fetch(
        `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=5&username=demo&style=MEDIUM`
      );
      
      if (!response.ok) throw new Error('GeoNames search failed');
      
      const data = await response.json();
      
      return (data.geonames || []).map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lng),
        display_name: `${item.name}${item.adminName1 ? ', ' + item.adminName1 : ''}${item.countryName ? ', ' + item.countryName : ''}`,
        type: item.fcode,
        source: 'geonames' as const,
        confidence: 0.65,
        category: item.fcl === 'P' ? 'city' : 'place',
      }));
    } catch (error) {
      console.error('GeoNames API error:', error);
      return [];
    }
  };

  // 🚀 MULTI-PASS UNIFIED SEARCH (Google-style)
  const unifiedSearch = async (query: string): Promise<UnifiedSearchResult[]> => {
    if (!query.trim()) {
      return [];
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCacheRef.current.has(cacheKey)) {
      console.log('📦 Returning cached results');
      return searchCacheRef.current.get(cacheKey)!;
    }

    const intent = detectIntent(query);
    console.log('🧠 Query intent:', intent);

    const results: UnifiedSearchResult[] = [];

    try {
      // 🔹 PASS 1: Primary search based on intent
      if (intent.isPOI) {
        console.log('🏨 POI-focused search');
        
        // For POI: Photon first, then specialized POI APIs
        const [photonResults, nominatimResults] = await Promise.all([
          searchPhoton(query),
          searchNominatim(query),
        ]);
        
        results.push(...photonResults, ...nominatimResults);
        
        // If we found a city, enrich with POIs
        if (photonResults.length > 0) {
          const topResult = photonResults[0];
          setLastSearchedCity({ lat: topResult.lat, lng: topResult.lng });
          
          const [openTripMapResults, overpassResults] = await Promise.all([
            OPENTRIPMAP_API_KEY ? searchOpenTripMap(query, topResult.lat, topResult.lng) : Promise.resolve([]),
            searchOverpass(query, topResult.lat, topResult.lng),
          ]);
          
          results.push(...openTripMapResults, ...overpassResults);
        }
      } else if (intent.isCity) {
        console.log('🌍 City-focused search');
        
        // For cities: Photon + Open-Meteo + GeoNames
        const [photonResults, openMeteoResults, geoNamesResults] = await Promise.all([
          searchPhoton(query),
          searchOpenMeteo(query),
          searchGeoNames(query),
        ]);
        
        results.push(...photonResults, ...openMeteoResults, ...geoNamesResults);
      } else {
        console.log('📍 General search');
        
        // General: All text-based APIs
        const [photonResults, nominatimResults, openMeteoResults] = await Promise.all([
          searchPhoton(query),
          searchNominatim(query),
          searchOpenMeteo(query),
        ]);
        
        results.push(...photonResults, ...nominatimResults, ...openMeteoResults);
      }

      // 🔹 PASS 2: Fallback if weak results
      if (results.length < 3) {
        console.log('🔄 Fallback search');
        const fallbackResults = await searchNominatim(query);
        results.push(...fallbackResults);
      }

      // 🔹 PASS 3: Safety net
      if (results.length === 0) {
        console.log('🆘 Last resort search');
        const lastResortResults = await searchOpenMeteo(query);
        results.push(...lastResortResults);
      }

      // Remove duplicates (same coordinates)
      const uniqueResults = results.filter((result, index, self) =>
        index === self.findIndex((r) => 
          Math.abs(r.lat - result.lat) < 0.0001 && Math.abs(r.lng - result.lng) < 0.0001
        )
      );

      // Calculate distances from last searched city
      if (lastSearchedCity) {
        uniqueResults.forEach(result => {
          const R = 6371000; // Earth radius in meters
          const dLat = (result.lat - lastSearchedCity.lat) * Math.PI / 180;
          const dLng = (result.lng - lastSearchedCity.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lastSearchedCity.lat * Math.PI / 180) * Math.cos(result.lat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          result.distance = R * c;
        });
      }

      // Apply dynamic scoring and sort
      const scoredResults = uniqueResults.map(result => ({
        ...result,
        confidence: calculateDynamicScore(result, query, intent),
      }));

      // Sort by confidence (highest first) - exact matches will naturally float to top
      scoredResults.sort((a, b) => {
        // Primary sort: confidence score
        if (Math.abs(b.confidence - a.confidence) > 0.01) {
          return b.confidence - a.confidence;
        }
        // Secondary sort: source reliability
        const sourceOrder = { photon: 0, pelias: 1, opentripmap: 2, overpass: 3, nominatim: 4, geonames: 5, openmeteo: 6 };
        return (sourceOrder[a.source] || 99) - (sourceOrder[b.source] || 99);
      });

      // Cache results
      searchCacheRef.current.set(cacheKey, scoredResults);

      return scoredResults;

    } catch (error) {
      console.error('Unified search error:', error);
      return results;
    }
  };

  // Live search with debounce (SUGGESTIONS ONLY)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const results = await unifiedSearch(searchQuery);
      setSearchResults(results.slice(0, 15)); // Show top 15 suggestions
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Handle explicit Search Button Click (point to best match)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await unifiedSearch(searchQuery);
    setIsSearching(false);

    if (results.length > 0) {
      const best = results[0]; // Highest scored result
      setSelectedLocation({ lat: best.lat, lng: best.lng });
      setAddress(best.display_name);
      setSearchResults([]);
      setSearchQuery('');
    } else {
      // No results found
      setSearchResults([]);
    }
  };

  const handleSelectResult = (result: UnifiedSearchResult) => {
    setSelectedLocation({ lat: result.lat, lng: result.lng });
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    
    // Reverse geocode with Nominatim
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'EventManagementApp/1.0' } }
    )
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
    onLocationSelect(selectedLocation, address);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Get badge info based on source
  const getSourceBadge = (source: string) => {
    const badges = {
      photon: { variant: 'default' as const, icon: Search, label: 'Smart' },
      pelias: { variant: 'default' as const, icon: Search, label: 'Geo' },
      opentripmap: { variant: 'secondary' as const, icon: Building2, label: 'POI' },
      overpass: { variant: 'secondary' as const, icon: Hotel, label: 'Local' },
      nominatim: { variant: 'outline' as const, icon: MapPinned, label: 'Area' },
      openmeteo: { variant: 'outline' as const, icon: MapPin, label: 'City' },
      geonames: { variant: 'outline' as const, icon: Landmark, label: 'World' },
    };
    return badges[source as keyof typeof badges] || badges.photon;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <MapPin className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[90vh] sm:h-[80vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Select Location on Map</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full gap-3 sm:gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative" ref={searchContainerRef}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search: hotels, cities, landmarks, addresses..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  type="text"
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              <Button 
                type="submit"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full sm:w-auto"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Smart Search Results with Confidence Indicators */}
            {searchResults.length > 0 && (
              <div className="absolute z-[2000] top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-64 sm:max-h-80 overflow-auto">
                {searchResults.map((result, index) => {
                  const badge = getSourceBadge(result.source);
                  const Icon = badge.icon;
                  const confidencePercent = Math.round(result.confidence * 100);
                  
                  return (
                    <div
                      key={`${result.source}-${index}`}
                      className="p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => handleSelectResult(result)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm line-clamp-2 flex items-center gap-2">
                            {result.display_name}
                            {confidencePercent >= 85 && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {confidencePercent}%
                              </span>
                            )}
                          </div>
                          {result.type && (
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                              {result.type}
                            </div>
                          )}
                        </div>
                        <Badge variant={badge.variant} className="shrink-0 text-[10px] sm:text-xs">
                          <Icon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>

          {/* Map Container */}
          <div className="flex-1 relative min-h-[250px] sm:min-h-[400px]">
            <MapContainer
              center={[selectedLocation.lat, selectedLocation.lng]}
              zoom={13}
              zoomControl={false}
              style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ZoomControl position="bottomright" />
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
              <MapClickHandler onMarkerChange={handleMapClick} />
              <MapUpdater center={[selectedLocation.lat, selectedLocation.lng]} />
            </MapContainer>
          </div>

          {/* Selected Location Info */}
          <div className="space-y-1 sm:space-y-2">
            <div className="text-xs sm:text-sm font-medium">Selected Location:</div>
            <div className="text-xs sm:text-sm text-gray-600 break-words">
              {address || `Latitude: ${selectedLocation.lat.toFixed(6)}, Longitude: ${selectedLocation.lng.toFixed(6)}`}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              type="button"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              type="button"
              className="w-full sm:w-auto"
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};