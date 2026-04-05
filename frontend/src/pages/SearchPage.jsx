import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyAPI } from '../api';
import PropertyCard from '../components/PropertyCard';
import { Search, Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import GoogleAutocomplete from '../components/GoogleAutocomplete';

const TYPES = ['1BHK', '2BHK', '3BHK', 'Commercial'];
const SORTS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc',label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
  { value: 'rating',   label: 'Top Rated' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q:         searchParams.get('q') || '',
    type:      searchParams.get('type') || '',
    city:      '',
    min_price: '',
    max_price: '',
    sort:      'newest',
    page:      1,
  });

  const fetchProps = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params = { ...f };
      if (!params.q)         delete params.q;
      if (!params.type)      delete params.type;
      if (!params.city)      delete params.city;
      if (!params.min_price) delete params.min_price;
      if (!params.max_price) delete params.max_price;
      const res = await propertyAPI.search(params);
      setProperties(res.data.properties);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProps(filters); }, []);

  const apply = () => {
    const f = { ...filters, page: 1 };
    setFilters(f);
    fetchProps(f);
  };

  const reset = () => {
    const f = { q: '', type: '', city: '', min_price: '', max_price: '', sort: 'newest', page: 1 };
    setFilters(f);
    fetchProps(f);
  };

  const changePage = (p) => {
    const f = { ...filters, page: p };
    setFilters(f);
    fetchProps(f);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            id="search-q"
            type="text"
            value={filters.q}
            onChange={e => setFilters({ ...filters, q: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && apply()}
            placeholder="Search by title, address..."
            className="input-field pl-12 py-4 text-base"
          />
        </div>
        <button id="search-apply" onClick={apply} className="btn-primary px-6 py-4">Search</button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-ghost px-4 py-4 flex items-center gap-2"
        >
          <SlidersHorizontal size={18} /> Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="glass-card p-6 mb-6 animate-fadeInUp">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Property Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setFilters(f => ({ ...f, type: f.type === t ? '' : t }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      filters.type === t ? 'gradient-primary text-white border-transparent' : 'border-[var(--border)] text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">City</label>
              <GoogleAutocomplete 
                onLocationSelect={(loc) => setFilters({ ...filters, city: loc.city || loc.address })}
                initialValue={filters.city}
                options={{ types: ['(cities)'] }}
                showMap={false}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Price Range (₹/mo)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.min_price}
                  onChange={e => setFilters({ ...filters, min_price: e.target.value })}
                  placeholder="Min"
                  className="input-field py-2 text-sm"
                />
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={e => setFilters({ ...filters, max_price: e.target.value })}
                  placeholder="Max"
                  className="input-field py-2 text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Sort By</label>
              <select
                value={filters.sort}
                onChange={e => setFilters({ ...filters, sort: e.target.value })}
                className="input-field py-2 text-sm cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={apply} className="btn-primary py-2 px-6">Apply Filters</button>
            <button onClick={reset} className="btn-ghost py-2 px-6 flex items-center gap-2 text-slate-400">
              <X size={14} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">
          {loading ? 'Searching...' : `${total.toLocaleString()} propert${total !== 1 ? 'ies' : 'y'} found`}
        </p>
        <select
          value={filters.sort}
          onChange={e => { const f = { ...filters, sort: e.target.value, page: 1 }; setFilters(f); fetchProps(f); }}
          className="input-field py-2 text-sm w-auto cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', width: 'auto' }}
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: 340 }} />)}
        </div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No properties found</h3>
          <p className="text-slate-400">Try adjusting your filters or search term</p>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => changePage(filters.page - 1)}
            disabled={filters.page <= 1}
            className="btn-ghost py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => changePage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                p === filters.page ? 'gradient-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => changePage(filters.page + 1)}
            disabled={filters.page >= pages}
            className="btn-ghost py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
