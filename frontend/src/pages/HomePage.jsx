import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertyAPI, aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { Search, TrendingUp, Shield, MessageCircle, Star, Home, Building2, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    propertyAPI.search({ limit: 6, sort: 'rating' })
      .then(r => setFeatured(r.data.properties))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));

    if (user) {
      aiAPI.recommendations()
        .then(r => setRecommended(r.data.recommendations))
        .catch(() => {});
    }
  }, [user]);

  const stats = [
    { label: 'Properties Listed', value: '10,000+', icon: Building2, color: 'var(--primary)' },
    { label: 'Happy Tenants',    value: '50,000+', icon: Home,      color: 'var(--success)' },
    { label: 'Cities Covered',   value: '200+',    icon: TrendingUp, color: 'var(--accent)' },
    { label: 'AI Predictions',   value: '99.2%',   icon: Sparkles,  color: 'var(--warning)' },
  ];

  const features = [
    { icon: Sparkles,      title: 'AI Rent Prediction',     desc: 'Get accurate rent estimates powered by machine learning models trained on thousands of real listings.' },
    { icon: Shield,        title: 'Fraud Detection',        desc: 'Advanced algorithms automatically flag suspicious listings to keep you safe.' },
    { icon: MessageCircle, title: 'Real‑time Chat',         desc: 'Communicate instantly with property owners via our built-in WebSocket chat.' },
    { icon: Star,          title: 'Verified Reviews',       desc: 'Authentic reviews from real tenants to help you make informed decisions.' },
  ];

  return (
    <div className="animate-fadeIn">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden px-4 py-20">
        {/* BG orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--primary)' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: 'var(--accent)' }} />
          {/* grid */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Sparkles size={14} />
            AI-Powered Property Discovery
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
            Find Your Perfect{' '}
            <span className="gradient-text">Dream Home</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Discover thousands of verified rentals with AI-driven recommendations, real‑time chat, and transparent pricing.
          </p>

          {/* Search bar */}
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                id="hero-search"
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search city, locality, type..."
                className="input-field pl-12 py-4 text-base"
                onKeyDown={e => e.key === 'Enter' && window.location.assign(`/search?q=${searchQ}`)}
              />
            </div>
            <Link to={`/search?q=${searchQ}`} className="btn-primary px-8 py-4 text-base whitespace-nowrap">
              Search
            </Link>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {['1BHK', '2BHK', '3BHK', 'Commercial'].map(type => (
              <Link key={type} to={`/search?type=${type}`}
                className="px-4 py-2 rounded-full text-sm text-slate-300 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                {type}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Recommendations ──────────────────────────────────── */}
      {user && recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-indigo-400" />
                <span className="text-sm text-indigo-400 font-medium">AI Powered</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
            </div>
            <Link to="/search" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* ── Featured ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Top Rated Properties</h2>
            <p className="text-slate-400 text-sm mt-1">Highly reviewed by tenants</p>
          </div>
          <Link to="/search" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 340 }} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">No properties yet. Check back soon!</div>
        )}
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Why SmartRental?</h2>
          <p className="text-slate-400">Built with cutting‑edge technology for the best rental experience</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 flex gap-4 hover:border-indigo-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {!user && (
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 gradient-primary" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to find your next home?</h2>
              <p className="text-slate-200 mb-8">Join thousands of happy tenants who found their dream rental on SmartRental.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary py-4 px-10 text-base">Get Started Free</Link>
                <Link to="/search" className="btn-ghost py-4 px-10 text-base text-white border-white/30">Browse Properties</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
