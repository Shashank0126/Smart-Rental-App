import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader, Navigation } from 'lucide-react';

// Fix leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      reverseGeocode(lat, lng, onLocationSelect);
    },
  });

  return position ? (
    <Marker position={position} />
  ) : null;
}

// Helper for reverse geocoding using Nominatim (free/open)
async function reverseGeocode(lat, lng, callback) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    
    const address = data.display_name;
    const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
    const state = data.address.state || '';
    
    callback({ address, city, state, lat, lng });
  } catch (error) {
    console.error("Geocoding error:", error);
    callback({ address: 'Manual Location', city: '', state: '', lat, lng });
  }
}

// Separate component to handle map movement
function MapControl({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function LeafletLocationPicker({ onLocationSelect, initialCoords = null }) {
  const [position, setPosition] = useState(initialCoords ? [initialCoords.lat, initialCoords.lng] : [19.0760, 72.8777]); // Default to Mumbai
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng, (data) => {
          onLocationSelect(data);
          setLoading(false);
        });
      },
      () => {
        setLoading(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          className="btn-ghost text-xs py-2 px-3 flex items-center gap-2 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10"
          disabled={loading}
        >
          {loading ? <Loader className="animate-spin" size={12} /> : <Navigation size={12} />}
          Use Current Location
        </button>
      </div>

      <div className="relative h-[300px] w-full rounded-xl overflow-hidden border border-white/10 z-0">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#1a1d23' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
          <MapControl center={position} />
        </MapContainer>
        
        <div className="absolute bottom-2 right-2 z-[1000] bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-slate-400 pointer-events-none">
          Click on map to pick location
        </div>
      </div>
    </div>
  );
}
