import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ownerAPI, propertyAPI } from '../../api';
import toast from 'react-hot-toast';
import { Upload, X, Loader, CheckCircle, IndianRupee, MapPin } from 'lucide-react';
import GoogleAutocomplete from '../../components/GoogleAutocomplete';

const TYPES    = ['1BHK','2BHK','3BHK','Commercial'];
const AMENITIES = ['WiFi','Parking','Gym','AC','TV','Security','Water','Lift','Garden','Balcony'];

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newImages, setNewImages] = useState([]);
  const [form, setForm] = useState({
    title: '', type: '2BHK', price: '', description: '', amenities: [], size: '',
    location: { address: '', lat: '', lng: '', city: '', state: '' },
  });

  useEffect(() => {
    propertyAPI.getById(id)
      .then(r => {
        const p = r.data;
        setForm({
          title: p.title || '', type: p.type || '2BHK', price: p.price || '',
          description: p.description || '', amenities: p.amenities || [],
          size: p.size || '',
          location: {
            address: p.location?.address || '',
            lat:     p.location?.lat || '',
            lng:     p.location?.lng || '',
            city:    p.location?.city || '',
            state:   p.location?.state || '',
          },
        });
      })
      .catch(() => toast.error('Failed to load property'))
      .finally(() => setFetching(false));
  }, [id]);

  const set    = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const setLoc = (f, v) => setForm(prev => ({ ...prev, location: { ...prev.location, [f]: v } }));
  const toggleAmenity = (am) => setForm(prev => ({
    ...prev,
    amenities: prev.amenities.includes(am)
      ? prev.amenities.filter(a => a !== am)
      : [...prev.amenities, am],
  }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      if (form.title)       fd.append('title',       form.title);
      if (form.type)        fd.append('type',        form.type);
      if (form.price)       fd.append('price',       form.price);
      if (form.description) fd.append('description', form.description);
      fd.append('amenities', JSON.stringify(form.amenities));
      fd.append('location',  JSON.stringify({
        address: form.location.address,
        lat:     parseFloat(form.location.lat) || 0,
        lng:     parseFloat(form.location.lng) || 0,
        city:    form.location.city,
        state:   form.location.state,
      }));
      if (form.size) fd.append('size', form.size);
      newImages.forEach(img => fd.append('new_images', img));
      await ownerAPI.updateProperty(id, fd);
      toast.success('Property updated!');
      navigate('/owner/properties');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size={36} className="animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Edit Property</h1>
        <p className="text-slate-400 text-sm mt-1">Update your listing details</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
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
              <input type="number" value={form.size} onChange={e => set('size', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Rent (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input-field pl-10" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <MapPin size={18} className="text-indigo-400" /> Location
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location Search *</label>
            <GoogleAutocomplete 
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
              initialValue={form.location.address}
              initialCoords={form.location.lat && form.location.lng ? { lat: parseFloat(form.location.lat), lng: parseFloat(form.location.lng) } : null}
              showMap={true}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
              <input value={form.location.city} onChange={e => setLoc('city', e.target.value)} placeholder="City" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
              <input value={form.location.state} onChange={e => setLoc('state', e.target.value)} placeholder="State" className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
              <input type="number" step="any" value={form.location.lat} onChange={e => setLoc('lat', e.target.value)} placeholder="Latitude" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
              <input type="number" step="any" value={form.location.lng} onChange={e => setLoc('lng', e.target.value)} placeholder="Longitude" className="input-field" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Amenities</h2>
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

        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Add More Photos</h2>
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <Upload size={24} className="text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Click to add more photos</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => setNewImages(prev => [...prev, ...Array.from(e.target.files)])} />
          </div>
          {newImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {newImages.map((img, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-24 object-cover rounded-xl" />
                  <button type="button" onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary py-3 px-8 flex-1">
            {loading ? <span className="flex items-center justify-center gap-2"><Loader size={16} className="animate-spin" /> Saving...</span> : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/owner/properties')} className="btn-ghost py-3 px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
