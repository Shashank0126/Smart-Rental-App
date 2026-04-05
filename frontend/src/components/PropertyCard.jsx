import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, BedDouble, IndianRupee, Wifi, Car, Dumbbell, Wind } from 'lucide-react';
import { favoriteAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AMENITY_ICONS = {
  'WiFi': Wifi, 'Parking': Car, 'Gym': Dumbbell, 'AC': Wind,
};

const TYPE_COLORS = {
  '1BHK': 'badge-primary', '2BHK': 'badge-success', '3BHK': 'badge-warning', 'Commercial': 'badge-danger'
};

export default function PropertyCard({ property, onFavoriteToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await favoriteAPI.add({ propertyId: property.id });
      setIsFav(res.data.isFavorite);
      toast.success(res.data.message);
      onFavoriteToggle?.(property.id, res.data.isFavorite);
    } catch {
      toast.error('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  const image = property.images?.[0] || `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80`;

  return (
    <Link to={`/properties/${property.id}`} className="property-card block group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={property.title}
          className="w-full h-52 object-cover"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80'; }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Favorite Button */}
        <button
          onClick={toggleFav}
          disabled={loading}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-lg transition-all duration-300 ${
            isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500'
          }`}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${TYPE_COLORS[property.type] || 'badge-primary'}`}>
            {property.type}
          </span>
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1 text-white font-bold text-lg">
            <IndianRupee size={16} />
            {property.price?.toLocaleString('en-IN')}
            <span className="text-sm font-normal text-slate-300">/mo</span>
          </div>
        </div>

        {/* Rating */}
        {property.avgRating > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white font-medium">{property.avgRating.toFixed(1)}</span>
          </div>
        )}

        {/* Flag indicator */}
        {property.isFlagged && (
          <div className="absolute inset-0 border-2 border-red-500 rounded-t-2xl pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0 bg-red-500 text-white text-xs px-3 py-0.5 rounded-b-lg">
              ⚠ Flagged
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-base truncate mb-1 group-hover:text-indigo-400 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-slate-400 text-sm mb-3">
          <MapPin size={13} />
          <span className="truncate">{property.location?.address || 'Location not specified'}</span>
        </div>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {property.amenities.slice(0, 3).map((am) => {
              const Icon = AMENITY_ICONS[am];
              return (
                <span key={am} className="flex items-center gap-1 text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                  {Icon && <Icon size={10} />} {am}
                </span>
              );
            })}
            {property.amenities.length > 3 && (
              <span className="text-xs text-slate-500">+{property.amenities.length - 3} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <span className="text-xs text-slate-500">
            By {property.ownerName || 'Owner'}
          </span>
          {property.reviewCount > 0 && (
            <span className="text-xs text-slate-500">
              {property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
