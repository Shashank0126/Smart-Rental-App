import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ownerAPI } from '../../api';
import { Plus, Edit2, Trash2, AlertTriangle, MapPin, IndianRupee, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    ownerAPI.myProperties()
      .then(r => setProperties(r.data))
      .catch(() => toast.error('Failed to load properties'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    setDeleting(id);
    try {
      await ownerAPI.deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success('Property deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size={36} className="animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Properties</h1>
          <p className="text-slate-400 text-sm mt-1">{properties.length} listing{properties.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/owner/properties/new" className="btn-primary flex items-center gap-2 py-3 px-5">
          <Plus size={18} /> Add Property
        </Link>
      </div>

      {properties.length > 0 ? (
        <div className="space-y-4">
          {properties.map(p => (
            <div key={p.id} className="glass-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <img
                src={p.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=80'}
                alt={p.title}
                className="w-full sm:w-28 h-24 object-cover rounded-xl flex-shrink-0"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=80'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-white truncate">{p.title}</h3>
                  <span className="badge badge-primary text-xs">{p.type}</span>
                  {p.isFlagged && (
                    <span className="badge badge-danger text-xs flex items-center gap-1">
                      <AlertTriangle size={10} /> Flagged
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={13} /> {p.location?.address || 'No address'}</span>
                  <span className="flex items-center gap-1"><IndianRupee size={13} /> {p.price?.toLocaleString('en-IN')}/mo</span>
                </div>
                {p.isFlagged && p.fraudReasons?.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg text-xs text-amber-400" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    ⚠ {p.fraudReasons.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/owner/properties/edit/${p.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  style={{ border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <Edit2 size={14} /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {deleting === p.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Building2 size={56} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No properties yet</h3>
          <p className="text-slate-400 mb-6">Start listing your properties to attract tenants</p>
          <Link to="/owner/properties/new" className="btn-primary py-3 px-8">List First Property</Link>
        </div>
      )}
    </div>
  );
}
