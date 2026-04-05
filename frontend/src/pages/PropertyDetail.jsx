import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertyAPI, favoriteAPI, aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  MapPin, Star, Heart, MessageCircle, IndianRupee, BedDouble,
  Wifi, Car, Dumbbell, Wind, Tv, Shield, Droplets, CheckCircle,
  ChevronLeft, ChevronRight, Phone, Mail, Sparkles, AlertTriangle
} from 'lucide-react';

const AMENITY_ICONS = {
  WiFi: Wifi, Parking: Car, Gym: Dumbbell, AC: Wind, TV: Tv,
  Security: Shield, Water: Droplets,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    propertyAPI.getById(id)
      .then(r => {
        setProperty(r.data);
        // Try AI rent prediction
        if (r.data.type && r.data.size) {
          aiAPI.predictRent({
            property_type: r.data.type,
            size: r.data.size,
            location_city: r.data.location?.city || 'other',
            amenities_count: r.data.amenities?.length || 0,
          }).then(p => setPrediction(p.data)).catch(() => {});
        }
      })
      .catch(() => toast.error('Property not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await favoriteAPI.add({ propertyId: id });
      setIsFav(res.data.isFavorite);
      toast.success(res.data.message);
    } catch { toast.error('Failed to update favorites'); }
  };

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    if (!review.comment.trim()) { toast.error('Write a comment'); return; }
    setSubmittingReview(true);
    try {
      const res = await propertyAPI.addReview(id, review);
      toast.success('Review submitted!');
      setProperty(prev => ({ ...prev, avgRating: res.data.avgRating }));
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="skeleton rounded-2xl" style={{ height: 400 }} />
      <div className="skeleton rounded-xl" style={{ height: 200 }} />
    </div>
  );

  if (!property) return (
    <div className="text-center py-20 text-slate-400">Property not found.</div>
  );

  const images = property.images?.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Back */}
      <Link to="/search" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={18} /> Back to search
      </Link>

      {/* Image Gallery */}
      <div className="relative rounded-2xl overflow-hidden mb-8 group" style={{ height: 420 }}>
        <img
          src={images[imgIdx]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Prev/Next */}
        {images.length > 1 && (
          <>
            <button onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button onClick={() => setImgIdx((imgIdx + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
              <ChevronRight size={20} className="text-white" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white w-6' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {/* Flagged */}
        {property.isFlagged && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            <AlertTriangle size={14} /> Flagged Property
          </div>
        )}

        {/* Favorite */}
        <button onClick={toggleFav}
          className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
            isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500'
          }`}>
          <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge badge-primary">{property.type}</span>
              {property.avgRating > 0 && (
                <span className="badge badge-warning flex items-center gap-1">
                  <Star size={11} className="fill-amber-400" /> {property.avgRating.toFixed(1)} ({property.reviewCount})
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin size={16} />
              <span>{property.location?.address}</span>
              {property.location?.city && <span className="text-slate-500">• {property.location.city}</span>}
            </div>
          </div>

          {/* Price */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Monthly Rent</p>
              <div className="flex items-center gap-1 text-3xl font-bold text-white mt-1">
                <IndianRupee size={22} />
                {property.price?.toLocaleString('en-IN')}
                <span className="text-lg font-normal text-slate-400">/mo</span>
              </div>
            </div>
            {property.size && (
              <div className="text-right">
                <p className="text-slate-400 text-sm">Size</p>
                <p className="text-xl font-semibold text-white mt-1">{property.size} sq.ft</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
            <p className="text-slate-400 leading-relaxed">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map(am => {
                  const Icon = AMENITY_ICONS[am] || CheckCircle;
                  return (
                    <div key={am} className="flex items-center gap-2 text-slate-300 text-sm"
                      style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                      <Icon size={16} className="text-indigo-400" />
                      {am}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Prediction */}
          {prediction && (
            <div className="glass-card p-6" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">AI Rent Analysis</h2>
                <span className="badge badge-primary ml-auto">{prediction.confidence} Confidence</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Low Estimate</p>
                  <p className="text-lg font-bold text-green-400">₹{prediction.range_low?.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-center" style={{ padding: '12px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-xs text-indigo-300 mb-1">AI Predicted</p>
                  <p className="text-xl font-bold text-indigo-400">₹{prediction.predicted_rent?.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">High Estimate</p>
                  <p className="text-lg font-bold text-amber-400">₹{prediction.range_high?.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Listed at ₹{property.price?.toLocaleString('en-IN')} — {
                  property.price < prediction.range_low ? '⬇ Below market' :
                  property.price > prediction.range_high ? '⬆ Above market' : '✅ Market rate'
                }
              </p>
            </div>
          )}

          {/* Reviews */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Reviews ({property.reviews?.length || 0})</h2>

            {user?.role === 'user' && (
              <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-slate-300 mb-3">Write a Review</p>
                {/* Stars */}
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setReview(r => ({ ...r, rating: s }))}>
                      <Star size={22} className={`transition-colors ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={review.comment}
                  onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                  placeholder="Share your experience..."
                  rows={3}
                  className="input-field resize-none mb-3"
                />
                <button onClick={submitReview} disabled={submittingReview} className="btn-primary py-2 px-6">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}

            {property.reviews?.length > 0 ? (
              <div className="space-y-4">
                {property.reviews.map(rev => (
                  <div key={rev.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                      {rev.userName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{rev.userName}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={12} className={s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{rev.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Right: Owner card + contact */}
        <div className="space-y-4">
          <div className="glass-card p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">Property Owner</h3>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-white">
                {property.ownerName?.[0]?.toUpperCase() || 'O'}
              </div>
              <div>
                <p className="font-semibold text-white">{property.ownerName || 'Owner'}</p>
                <p className="text-xs text-slate-400">Property Owner</p>
              </div>
            </div>

            {property.ownerPhone && (
              <a href={`tel:${property.ownerPhone}`}
                className="flex items-center gap-3 py-3 px-4 rounded-xl mb-3 text-sm text-slate-300 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <Phone size={16} className="text-indigo-400" />
                {property.ownerPhone}
              </a>
            )}

            {user && user.role !== 'admin' && (
              <Link
                to={`/chat/${property.ownerId}`}
                state={{ propertyId: id, ownerName: property.ownerName }}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Contact Owner
              </Link>
            )}
            {!user && (
              <Link to="/login" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <MessageCircle size={18} />
                Login to Contact
              </Link>
            )}

            {property.location?.lat && property.location?.lng && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Location</p>
                <div className="rounded-xl overflow-hidden" style={{ height: 180, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <iframe
                    title="map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ filter: 'invert(90%) hue-rotate(180deg)' }}
                    src={`https://maps.google.com/maps?q=${property.location.lat},${property.location.lng}&z=15&output=embed`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
