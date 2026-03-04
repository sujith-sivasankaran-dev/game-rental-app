'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Locate } from 'lucide-react';

export default function LocationPicker({ 
  initialLocation = null, 
  onLocationSelect,
  height = '300px'
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isLoaded, setIsLoaded] = useState(false);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Keep the callback ref updated
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps loaded');
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Geocode function
  const geocodeLatLng = useCallback((lat, lng) => {
    if (!window.google?.maps) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        const location = {
          latitude: lat,
          longitude: lng,
          full_address: address,
        };
        setSelectedLocation(location);
        
        // Update input field
        if (inputRef.current) {
          inputRef.current.value = address;
        }
        
        onLocationSelectRef.current?.(location);
      }
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !inputRef.current) return;

    console.log('Initializing map...');

    const defaultCenter = initialLocation 
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      ],
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
    });

    mapInstanceRef.current = map;

    // Create marker
    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map: map,
      draggable: true,
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00ffff" stroke="#000" stroke-width="1">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3" fill="#000"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      }
    });

    markerRef.current = marker;

    // Click on map to set marker
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition(e.latLng);
      geocodeLatLng(lat, lng);
    });

    // Drag marker
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        geocodeLatLng(position.lat(), position.lng());
      }
    });

    // Initialize autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
    });
    
    autocomplete.bindTo('bounds', map);
    autocompleteRef.current = autocomplete;

    // Handle place selection - Use closure properly
    const handlePlaceChanged = () => {
      console.log('Place changed event fired');
      const place = autocomplete.getPlace();
      
      console.log('Selected place:', place);
      
      if (!place.geometry || !place.geometry.location) {
        console.log('No geometry for selected place');
        return;
      }

      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      console.log('Moving to coordinates:', lat, lng);

      // Use refs to get current map and marker instances
      const currentMap = mapInstanceRef.current;
      const currentMarker = markerRef.current;

      if (currentMap && currentMarker) {
        // Pan and zoom to the selected place
        currentMap.panTo(location);
        currentMap.setZoom(17);
        
        // Move the marker
        currentMarker.setPosition(location);

        console.log('Map and marker updated');

        const locationData = {
          latitude: lat,
          longitude: lng,
          full_address: place.formatted_address || place.name || '',
        };
        
        setSelectedLocation(locationData);
        onLocationSelectRef.current?.(locationData);
      } else {
        console.error('Map or marker ref is null');
      }
    };

    autocomplete.addListener('place_changed', handlePlaceChanged);

    // Set initial address if provided
    if (initialLocation?.full_address && inputRef.current) {
      inputRef.current.value = initialLocation.full_address;
    }

    console.log('Map initialization complete');

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, initialLocation, geocodeLatLng]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const currentMap = mapInstanceRef.current;
        const currentMarker = markerRef.current;

        if (currentMap && currentMarker) {
          const pos = new window.google.maps.LatLng(lat, lng);
          currentMap.panTo(pos);
          currentMap.setZoom(17);
          currentMarker.setPosition(pos);
          geocodeLatLng(lat, lng);
        }
      },
      (error) => {
        alert('Unable to get your location: ' + error.message);
      },
      { enableHighAccuracy: true }
    );
  }, [geocodeLatLng]);

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900 rounded-lg border border-white/10 min-h-[200px] sm:min-h-[250px]"
        style={{ height }}
      >
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent mx-auto"></div>
          <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input - Responsive */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a location..."
            className="w-full h-10 sm:h-11 pl-10 pr-4 bg-black/50 border border-white/10 rounded-md text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            autoComplete="off"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          className="h-10 sm:h-11 px-4 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 flex-shrink-0"
          title="Use current location"
        >
          <Locate className="h-4 w-4 mr-2 sm:mr-0" />
          <span className="sm:hidden">My Location</span>
        </Button>
      </div>

      {/* Map - Responsive height */}
      <div 
        ref={mapRef}
        className="rounded-lg border border-white/10 overflow-hidden w-full min-h-[200px] sm:min-h-[250px]"
        style={{ height: 'clamp(200px, 40vw, 350px)' }}
      />

      {/* Selected Location Display - Responsive */}
      {selectedLocation && (
        <div className="flex items-start gap-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
          <MapPin className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-white text-sm font-medium">Selected Location</p>
            <p className="text-gray-400 text-xs break-words line-clamp-2">{selectedLocation.full_address}</p>
            <p className="text-gray-500 text-xs mt-1">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
