import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Filter, 
  Layers,
  Compass,
  Search,
  X,
  Star,
  Clock,
  Phone,
  Globe,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  description?: string;
  type: 'business' | 'event' | 'landmark' | 'custom';
  category?: string;
  rating?: number;
  reviews?: number;
  distance?: number;
  image?: string;
  metadata?: Record<string, any>;
  cluster?: boolean;
  clusterCount?: number;
}

export interface MapCluster {
  id: string;
  position: { lat: number; lng: number };
  markers: MapMarker[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface MagicMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onMarkerHover?: (marker: MapMarker | null) => void;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  clusteringEnabled?: boolean;
  searchEnabled?: boolean;
  filterEnabled?: boolean;
  categories?: Array<{ id: string; name: string; color: string; icon?: React.ReactNode }>;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
}

export default function MagicMap({
  markers,
  center = { lat: 25.7617, lng: -80.1918 }, // Miami default
  zoom = 13,
  height = '500px',
  onMarkerClick,
  onMarkerHover,
  onMapClick,
  clusteringEnabled = true,
  searchEnabled = true,
  filterEnabled = true,
  categories = [],
  className,
  showControls = true,
  interactive = true
}: MagicMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: currentZoom,
      mapTypeId: mapType,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      clickableIcons: false
    });

    setMap(mapInstance);

    // Add click listener
    mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        onMapClick?.(position);
      }
    });

    // Add zoom listener
    mapInstance.addListener('zoom_changed', () => {
      setCurrentZoom(mapInstance.getZoom() || 13);
    });

    return () => {
      setMap(null);
    };
  }, [googleMapsLoaded, center, mapType, onMapClick, currentZoom]);

  // Filter markers
  const filteredMarkers = markers.filter(marker => {
    if (activeFilters.size === 0) return true;
    return activeFilters.has(marker.type) || activeFilters.has(marker.category || '');
  });

  // Clustering logic
  useEffect(() => {
    if (!map || !clusteringEnabled) return;

    const clusterDistance = currentZoom > 15 ? 50 : currentZoom > 12 ? 100 : 200;
    const newClusters: MapCluster[] = [];
    const processedMarkers = new Set<string>();

    filteredMarkers.forEach(marker => {
      if (processedMarkers.has(marker.id)) return;

      const cluster: MapCluster = {
        id: `cluster-${marker.id}`,
        position: marker.position,
        markers: [marker],
        bounds: {
          north: marker.position.lat,
          south: marker.position.lat,
          east: marker.position.lng,
          west: marker.position.lng
        }
      };

      filteredMarkers.forEach(otherMarker => {
        if (otherMarker.id === marker.id || processedMarkers.has(otherMarker.id)) return;

        const distance = getDistance(marker.position, otherMarker.position);
        if (distance < clusterDistance) {
          cluster.markers.push(otherMarker);
          cluster.bounds.north = Math.max(cluster.bounds.north, otherMarker.position.lat);
          cluster.bounds.south = Math.min(cluster.bounds.south, otherMarker.position.lat);
          cluster.bounds.east = Math.max(cluster.bounds.east, otherMarker.position.lng);
          cluster.bounds.west = Math.min(cluster.bounds.west, otherMarker.position.lng);
          processedMarkers.add(otherMarker.id);
        }
      });

      processedMarkers.add(marker.id);
      newClusters.push(cluster);
    });

    setClusters(newClusters);
  }, [map, filteredMarkers, currentZoom, clusteringEnabled]);

  // Update markers on map
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.custom-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    const displayMarkers = clusteringEnabled ? clusters : filteredMarkers.map(m => ({ ...m, cluster: false }));

    displayMarkers.forEach((item, index) => {
      const marker = clusteringEnabled ? item as MapCluster : item as MapMarker;
      const isCluster = 'markers' in marker;
      
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        position: relative;
        cursor: pointer;
        transform: translate(-50%, -100%);
        z-index: ${isCluster ? 1000 : 500};
      `;

      if (isCluster && marker.markers.length > 1) {
        // Cluster marker
        markerElement.innerHTML = `
          <div class="cluster-marker" style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          ">
            ${marker.markers.length}
          </div>
        `;
      } else {
        // Single marker
        const singleMarker = isCluster ? marker.markers[0] : marker as MapMarker;
        const category = categories.find(c => c.id === singleMarker.category);
        const color = category?.color || '#3b82f6';
        
        markerElement.innerHTML = `
          <div class="single-marker" style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 16px;
            ">
              ${category?.icon || '📍'}
            </div>
          </div>
        `;
      }

      // Add hover effects
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'translate(-50%, -100%) scale(1.2)';
        if (isCluster) {
          setHoveredMarker(null);
        } else {
          setHoveredMarker(marker as MapMarker);
          onMarkerHover?.(marker as MapMarker);
        }
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'translate(-50%, -100%) scale(1)';
        if (!isCluster) {
          setHoveredMarker(null);
          onMarkerHover?.(null);
        }
      });

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (isCluster) {
          // Zoom to cluster bounds
          const bounds = new google.maps.LatLngBounds();
          marker.markers.forEach(m => {
            bounds.extend(new google.maps.LatLng(m.position.lat, m.position.lng));
          });
          map.fitBounds(bounds);
        } else {
          setSelectedMarker(marker as MapMarker);
          onMarkerClick?.(marker as MapMarker);
        }
      });

      // Create Google Maps marker
      const googleMarker = new google.maps.marker.AdvancedMarkerElement({
        position: new google.maps.LatLng(marker.position.lat, marker.position.lng),
        map,
        content: markerElement
      });

      // Store reference for cleanup
      (markerElement as any).googleMarker = googleMarker;
    });
  }, [map, clusters, filteredMarkers, categories, clusteringEnabled, onMarkerClick, onMarkerHover]);

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (!map || !query.trim()) return;

    const geocoder = new google.maps.Geocoder();
    try {
      const results = await geocoder.geocode({ address: query });
      if (results.results.length > 0) {
        const location = results.results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(15);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, [map]);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        if (map) {
          map.setCenter(location);
          map.setZoom(15);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, [map]);

  // Map controls
  const zoomIn = useCallback(() => {
    if (map) {
      map.setZoom((map.getZoom() || 13) + 1);
    }
  }, [map]);

  const zoomOut = useCallback(() => {
    if (map) {
      map.setZoom((map.getZoom() || 13) - 1);
    }
  }, [map]);

  const resetView = useCallback(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterId)) {
        newFilters.delete(filterId);
      } else {
        newFilters.add(filterId);
      }
      return newFilters;
    });
  }, []);

  // Utility function to calculate distance
  const getDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  if (!googleMapsLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-100 rounded-2xl", className)} style={{ height }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-2xl overflow-hidden", className)}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full rounded-2xl"
        style={{ height }}
      />

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Card className="miami-glass border border-white/30">
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomIn}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomOut}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetView}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Compass className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getUserLocation}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      {searchEnabled && (
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="pl-10 pr-10 miami-glass border border-white/30 bg-white/90 backdrop-blur-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {filterEnabled && categories.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="miami-glass border border-white/30">
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeFilters.has(category.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter(category.id)}
                    className="flex items-center gap-2"
                    style={{
                      backgroundColor: activeFilters.has(category.id) ? category.color : undefined,
                      borderColor: activeFilters.has(category.id) ? category.color : undefined
                    }}
                  >
                    {category.icon}
                    <span>{category.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marker Info Panel */}
      <AnimatePresence>
        {(selectedMarker || hoveredMarker) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm"
          >
            <Card className="miami-glass miami-card-glow border border-white/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {(selectedMarker || hoveredMarker)?.title}
                    </h3>
                    {(selectedMarker || hoveredMarker)?.description && (
                      <p className="text-sm text-slate-600 mb-2">
                        {(selectedMarker || hoveredMarker)?.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {(selectedMarker || hoveredMarker)?.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{(selectedMarker || hoveredMarker)?.rating}</span>
                        </div>
                      )}
                      {(selectedMarker || hoveredMarker)?.distance && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{((selectedMarker || hoveredMarker)?.distance! / 1000).toFixed(1)}km</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMarker(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {categories.length > 0 && (
        <div className="absolute top-4 left-4 sm:left-auto sm:right-4 sm:top-20">
          <Card className="miami-glass border border-white/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-slate-600">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
