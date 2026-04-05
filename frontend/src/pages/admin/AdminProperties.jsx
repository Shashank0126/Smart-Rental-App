import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../api';
import { Building2, Trash2, Flag, FlagOff, AlertTriangle, MapPin, IndianRupee, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProperties() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [flagged,   setFlagged]   = useState(searchParams.get('flagged') === 'true' ? true : null);
  const [loading,   setLoading]   = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = async (pg = page, fl = flagged) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 12 };
      if (fl !== null) params.flagged = fl;
      const res = await adminAPI.allProperties(params);
      setProperties(res.data.properties);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load properties'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, flagged); }, [flagged]);

  const toggleFlag = async (id, currentFlagged) => {
    setProcessing(id + 'flag');
    try {
      await adminAPI.flagProperty(id, !currentFlagged);
      toast.success(`Property ${!currentFlagged ? 'flagged' : 'unflagged'}`);
      load(page, flagged);
    } catch { toast.error('Action failed'); }
    finally { setProcessing(null); }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    setProcessing(id + 'del');
    try {
      await adminAPI.deleteProperty(id);
      toast.success('Property deleted');
      load(page, flagged);
    } catch { toast.error('Delete failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Property Management</h1>
          <p className="text-slate-400 text-sm mt-1">{total} properties</p>
        </div>
        <div className="flex gap-2">
          {[null, true, false].map(v => (
            <button key={String(v)} onClick={() => { setFlagged(v); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                flagged === v ? 'gradient-primary text-white border-transparent' : 'border-[var(--border)] text-slate-400 hover:text-white'
              }`}>
              {v === null ? 'All' : v ? '⚠ Flagged' : '✅ Clean'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-indigo-400" /></div>
      ) : properties.length > 0 ? (
        <div className="space-y-3">
          {properties.map(p => (
            <div key={p.id} className={`glass-card p-4 flex gap-4 items-center ${p.isFlagged ? 'border-red-500/30' : ''}`}>
              <img
                src={p.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&q=80'}
                alt={p.title}
                className="w-20 h-16 object-cover rounded-xl flex-shrink-0"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&q=80'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-white text-sm truncate">{p.title}</h3>
                  <span className="badge badge-primary text-xs">{p.type}</span>
                  {p.isFlagged && (
                    <span className="badge badge-danger text-xs flex items-center gap-1">
                      <AlertTriangle size={9} /> Flagged
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={11} />{p.location?.address || '—'}</span>
                  <span className="flex items-center gap-1"><IndianRupee size={11} />{p.price?.toLocaleString('en-IN')}/mo</span>
                  <span>By: {p.ownerName || 'Unknown'}</span>
                </div>
                {p.isFlagged && p.fraudReasons?.length > 0 && (
                  <p className="text-xs text-amber-400 mt-1">⚠ {p.fraudReasons.join(', ')}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleFlag(p.id, p.isFlagged)}
                  disabled={!!processing}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 ${
                    p.isFlagged
                      ? 'text-green-400 hover:bg-green-500/10 border border-green-500/30'
                      : 'text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
                  }`}>
                  {processing === p.id + 'flag' ? <Loader size={12} className="animate-spin" /> : p.isFlagged ? <FlagOff size={12} /> : <Flag size={12} />}
                  {p.isFlagged ? 'Unflag' : 'Flag'}
                </button>
                <button
                  onClick={() => deleteProperty(p.id)}
                  disabled={!!processing}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                  {processing === p.id + 'del' ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Building2 size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No properties found</h3>
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setPage(p); load(p, flagged); }}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === page ? 'gradient-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
