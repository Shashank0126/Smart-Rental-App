import { useState, useEffect } from 'react';
import { favoriteAPI } from '../api';
import PropertyCard from '../components/PropertyCard';
import { Heart, Loader } from 'lucide-react';

export default function FavoritesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoriteAPI.getAll()
      .then(r => setProperties(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (id, isFav) => {
    if (!isFav) setProperties(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Heart size={20} className="text-red-400 fill-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Properties</h1>
          <p className="text-slate-400 text-sm">{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} saved</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={32} className="text-indigo-400 animate-spin" />
        </div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => (
            <PropertyCard key={p.id} property={p} onFavoriteToggle={handleToggle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <Heart size={56} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No saved properties</h3>
          <p className="text-slate-400 mb-6">Start saving properties you like!</p>
          <a href="/search" className="btn-primary py-3 px-8">Browse Properties</a>
        </div>
      )}
    </div>
  );
}
