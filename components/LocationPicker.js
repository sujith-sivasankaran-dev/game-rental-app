'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
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
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const defaultCenter = initialLocation 
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore

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
      // Mobile-friendly controls
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy', // Better for mobile
    });

    mapInstanceRef.current = map;

    // Add marker
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
      geocodeLatLng(position.lat(), position.lng());
    });

    // Initialize autocomplete with the actual DOM input element
    if (inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
      });
      autocomplete.bindTo('bounds', map);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.log('No geometry for place');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Move map and marker to the selected place
        map.setCenter(place.geometry.location);
        map.setZoom(17);
        marker.setPosition(place.geometry.location);

        const location = {
          latitude: lat,
          longitude: lng,
          full_address: place.formatted_address || place.name || '',
        };
        
        setSelectedLocation(location);
        onLocationSelect?.(location);
      });

      autocompleteRef.current = autocomplete;
    }

    // If initial location exists, set address in input
    if (initialLocation?.full_address && inputRef.current) {
      inputRef.current.value = initialLocation.full_address;
    }

  }, [isLoaded, initialLocation]);

  const geocodeLatLng = useCallback((lat, lng) => {
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
        
        onLocationSelect?.(location);
      }
    });
  }, [onLocationSelect]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapInstanceRef.current && markerRef.current) {
          const pos = new window.google.maps.LatLng(lat, lng);
          mapInstanceRef.current.setCenter(pos);
          mapInstanceRef.current.setZoom(17);
          markerRef.current.setPosition(pos);
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
