import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI, aiAPI } from '../../api';
import toast from 'react-hot-toast';
import { Upload, X, MapPin, Sparkles, Loader, IndianRupee, CheckCircle, Navigation } from 'lucide-react';
import LeafletLocationPicker from '../../components/LeafletLocationPicker';

const TYPES = ['1BHK', '2BHK', '3BHK', 'Commercial'];
const AMENITIES = ['WiFi', 'Parking', 'Gym', 'AC', 'TV', 'Security', 'Water', 'Lift', 'Garden', 'Balcony'];

export default function CreateProperty() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const [form, setForm] = useState({
    title: '',
    type: '2BHK',
    price: '',
    description: '',
    amenities: [],
    size: '',
    location: { address: '', lat: '', lng: '', city: '', state: '' },
  });

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const setLoc = (field, val) => setForm(prev => ({
    ...prev,
    location: { ...prev.location, [field]: val }
  }));

  const toggleAmenity = (am) => setForm(prev => ({
    ...prev,
    amenities: prev.amenities.includes(am)
      ? prev.amenities.filter(a => a !== am)
      : [...prev.amenities, am],
  }));

  const predictRent = async () => {
    if (!form.type || !form.size || !form.location.city) {
      toast.error('Fill type, size and city to predict rent');
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiAPI.predictRent({
        property_type: form.type,
        size: parseFloat(form.size),
        location_city: form.location.city,
        amenities_count: form.amenities.length,
      });
      setPrediction(res.data);
      toast.success('AI rent prediction generated!');
    } catch {
      toast.error('Prediction failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImages = (files) => {
    const arr = Array.from(files).slice(0, 5 - images.length);
    setImages(prev => [...prev, ...arr]);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.price || !form.description || !form.location.address) {
      toast.error('Fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      fd.append('title', form.title);
      fd.append('type', form.type);
      fd.append('price', form.price);
      fd.append('description', form.description);
      fd.append('amenities', JSON.stringify(form.amenities));

      fd.append('location', JSON.stringify({
        address: form.location.address,
        lat: parseFloat(form.location.lat) || 0,
        lng: parseFloat(form.location.lng) || 0,
        city: form.location.city,
        state: form.location.state,
      }));

      if (form.size) fd.append('size', form.size);
      images.forEach(img => fd.append('images', img));

      await ownerAPI.createProperty(fd);

      toast.success('Property listed successfully! 🎉');
      navigate('/owner/properties');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">List New Property</h1>
          <p className="text-slate-400 text-sm mt-1">Fill in the details to publish your rental listing</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
          <Sparkles size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">AI Supported</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Property Title *</label>
            <input 
              id="prop-title" 
              value={form.title} 
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Spacious 2BHK near Metro" 
              className="input-field" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Type *</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      form.type === t ? 'gradient-primary text-white border-transparent' : 'border-[var(--border)] text-slate-400 hover:text-white'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Size (sq.ft)</label>
              <input 
                type="number" 
                id="prop-size" 
                value={form.size} 
                onChange={e => set('size', e.target.value)}
                placeholder="e.g. 850" 
                className="input-field" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
            <textarea 
              id="prop-desc" 
              value={form.description} 
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the property, its features, nearby amenities..." 
              rows={4} 
              className="input-field resize-none" 
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg">Pricing</h2>

          {prediction && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-400" />
                <p className="text-sm font-medium text-indigo-300">AI Rent Suggestion</p>
                <span className="badge badge-primary ml-auto">{prediction.confidence}</span>
              </div>
              <p className="text-lg font-bold text-white">₹{prediction.predicted_rent?.toLocaleString('en-IN')}/mo</p>
              <p className="text-xs text-slate-400 mt-1">Range: ₹{prediction.range_low?.toLocaleString('en-IN')} – ₹{prediction.range_high?.toLocaleString('en-IN')}</p>
              <button type="button" onClick={() => set('price', Math.round(prediction.predicted_rent))}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <CheckCircle size={12} /> Use suggested price
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Rent (₹) *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  id="prop-price" 
                  type="number" 
                  value={form.price} 
                  onChange={e => set('price', e.target.value)}
                  placeholder="e.g. 25000" 
                  className="input-field pl-10" 
                />
              </div>
            </div>
            <div className="flex-shrink-0 pt-7">
              <button 
                type="button" 
                onClick={predictRent} 
                disabled={aiLoading}
                className="btn-ghost flex items-center gap-2 py-3 px-4 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 disabled:opacity-50"
              >
                {aiLoading ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                AI Predict
              </button>
            </div>
          </div>
        </div>

        {/* Location Section (Leaflet) */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg flex items-center gap-2">
            <MapPin size={18} className="text-indigo-400" /> Location
          </h2>
          
          <LeafletLocationPicker
            onLocationSelect={(loc) => {
              setForm(prev => ({
                ...prev,
                location: {
                  address: loc.address,
                  city: loc.city,
                  state: loc.state,
                  lat: loc.lat.toString(),
                  lng: loc.lng.toString()
                }
              }));
            }}
          />

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Address *</label>
              <textarea 
                value={form.location.address}
                readOnly
                placeholder="Select from map"
                className="input-field bg-white/5 cursor-default text-slate-400 h-20 resize-none py-3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                <input 
                  value={form.location.city} 
                  onChange={e => setLoc('city', e.target.value)}
                  placeholder="e.g. Mumbai" 
                  className="input-field" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                <input 
                  value={form.location.state} 
                  onChange={e => setLoc('state', e.target.value)}
                  placeholder="e.g. Maharashtra" 
                  className="input-field" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
                <input 
                  type="number" 
                  step="any" 
                  value={form.location.lat} 
                  onChange={e => setLoc('lat', e.target.value)}
                  placeholder="e.g. 19.0760" 
                  className="input-field text-slate-500" 
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
                <input 
                  type="number" 
                  step="any" 
                  value={form.location.lng} 
                  onChange={e => setLoc('lng', e.target.value)}
                  placeholder="e.g. 72.8777" 
                  className="input-field text-slate-500" 
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white text-lg mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(am => (
              <button key={am} type="button" onClick={() => toggleAmenity(am)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                  form.amenities.includes(am) ? 'gradient-primary text-white border-transparent' : 'border-[var(--border)] text-slate-400 hover:text-white'
                }`}>
                {form.amenities.includes(am) && <CheckCircle size={12} />}
                {am}
              </button>
            ))}
          </div>
        </div>

        {/* Images Upload Section */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white text-lg mb-4">Photos ({images.length}/5)</h2>
          <div
            className="upload-zone"
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); handleImages(e.dataTransfer.files); }}
          >
            <Upload size={28} className="text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Click or drag photos here</p>
            <p className="text-slate-600 text-xs mt-1">PNG, JPG – max 5 photos</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleImages(e.target.files)} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-24 object-cover rounded-xl" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} id="prop-submit" className="btn-primary py-3 px-8 flex-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2"><Loader size={16} className="animate-spin" /> Publishing...</span>
            ) : 'Publish Property'}
          </button>
          <button type="button" onClick={() => navigate('/owner/properties')} className="btn-ghost py-3 px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}