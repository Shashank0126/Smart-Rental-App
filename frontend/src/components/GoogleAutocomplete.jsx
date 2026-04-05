import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from '@react-google-maps/api';
import { MapPin, Search, Map as MapIcon, Loader } from 'lucide-react';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 19.0760, // Default to Mumbai
  lng: 72.8777,
};

export default function GoogleAutocomplete({ 
  onLocationSelect, 
  initialValue = '', 
  initialCoords = null,
  showMap = false,
  error = false,
  options = {}
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyPlaceholder = !apiKey || apiKey === 'your_google_maps_api_key';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(initialCoords || defaultCenter);
  const [address, setAddress] = useState(initialValue);
  const [isMapVisible, setIsMapVisible] = useState(showMap);

  if (isKeyPlaceholder) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm flex items-start gap-3">
        <MapIcon className="flex-shrink-0 mt-0.5" size={16} />
        <div>
          <p className="font-semibold mb-1">Google Maps API Key Required</p>
          <p className="opacity-80">Please add your API key to the <code className="bg-black/20 px-1 rounded">frontend/.env</code> file to enable location features. Make sure to enable Maps JavaScript API and Places API in the Google Cloud Console.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm">
        Failed to load Google Maps. Please check your API key and network connection.
      </div>
    );
  }

  useEffect(() => {
    if (initialCoords) {
      setPosition(initialCoords);
    }
  }, [initialCoords]);

  useEffect(() => {
    if (initialValue) {
      setAddress(initialValue);
    }
  }, [initialValue]);

  const onLoad = useCallback((autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.error("No details available for input: '" + place.name + "'");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newPos = { lat, lng };

      setPosition(newPos);
      setAddress(place.formatted_address);

      // Extract city and state
      let city = '';
      let state = '';
      place.address_components?.forEach(comp => {
        if (comp.types.includes('locality')) city = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
      });

      onLocationSelect({
        address: place.formatted_address,
        city,
        state,
        lat,
        lng,
      });

      if (map) {
        map.panTo(newPos);
        map.setZoom(16);
      }
    }
  };

  const onMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPos = { lat, lng };
    setPosition(newPos);
    
    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: newPos }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
        
        let city = '';
        let state = '';
        results[0].address_components?.forEach(comp => {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
        });

        onLocationSelect({
          address: results[0].formatted_address,
          city,
          state,
          lat,
          lng,
        });
      }
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10">
        <Loader className="animate-spin text-indigo-400 mr-2" size={18} />
        <span className="text-slate-400 text-sm">Loading Maps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged} options={options}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Enter property address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`input-field pl-10 ${error ? 'border-red-500/50' : ''}`}
            />
          </div>
        </Autocomplete>
        {isLoaded && (
          <button
            type="button"
            onClick={() => setIsMapVisible(!isMapVisible)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              isMapVisible ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:bg-white/5'
            }`}
            title="Toggle Map"
          >
            <MapIcon size={18} />
          </button>
        )}
      </div>

      {isMapVisible && (
        <div className="animate-fadeIn">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={position}
            zoom={14}
            onLoad={setMap}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                {
                  "elementType": "geometry",
                  "stylers": [{ "color": "#242f3e" }]
                },
                {
                  "elementType": "labels.text.fill",
                  "stylers": [{ "color": "#746855" }]
                },
                {
                  "elementType": "labels.text.stroke",
                  "stylers": [{ "color": "#242f3e" }]
                },
                {
                  "featureType": "administrative.locality",
                  "elementType": "labels.text.fill",
                  "stylers": [{ "color": "#d59563" }]
                },
                {
                  "featureType": "poi",
                  "elementType": "labels.text.fill",
                  "stylers": [{ "color": "#d59563" }]
                },
                {
                  "featureType": "road",
                  "elementType": "geometry",
                  "stylers": [{ "color": "#38414e" }]
                },
                {
                  "featureType": "road",
                  "elementType": "geometry.stroke",
                  "stylers": [{ "color": "#212a37" }]
                },
                {
                  "featureType": "road",
                  "elementType": "labels.text.fill",
                  "stylers": [{ "color": "#9ca5b3" }]
                },
                {
                  "featureType": "water",
                  "elementType": "geometry",
                  "stylers": [{ "color": "#17263c" }]
                }
              ]
            }}
          >
            <Marker
              position={position}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
              animation={window.google.maps.Animation.DROP}
            />
          </GoogleMap>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <MapPin size={10} /> Drag the pin for precise location detection
          </p>
        </div>
      )}
    </div>
  );
}
