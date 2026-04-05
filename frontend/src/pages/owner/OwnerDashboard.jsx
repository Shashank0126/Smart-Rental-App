import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ownerAPI } from '../../api';
import { Building2, MessageCircle, TrendingUp, AlertTriangle, Plus, Loader } from 'lucide-react';

export default function OwnerDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.myStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'My Properties', value: stats.totalProperties,  icon: Building2,     color: 'var(--primary)',  link: '/owner/properties' },
    { label: 'Total Inquiries', value: stats.totalInquiries, icon: MessageCircle, color: 'var(--success)',  link: '/owner/inquiries' },
    { label: 'Unread Messages', value: stats.unreadInquiries,icon: TrendingUp,    color: 'var(--accent)',   link: '/owner/inquiries' },
    { label: 'Flagged',         value: stats.flaggedProperties,icon: AlertTriangle,color: 'var(--danger)',  link: '/owner/properties' },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size={36} className="animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your properties and inquiries</p>
        </div>
        <Link to="/owner/properties/new" className="btn-primary flex items-center gap-2 py-3 px-5">
          <Plus size={18} /> List Property
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="stat-card text-center hover:border-indigo-500/40">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value ?? 0}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/owner/properties/new" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center"><Plus size={18} className="text-white" /></div>
              <div>
                <p className="font-medium text-white text-sm">Add New Property</p>
                <p className="text-xs text-slate-400">List a new rental property</p>
              </div>
            </Link>
            <Link to="/owner/inquiries" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors" style={{ border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <MessageCircle size={18} className="text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">View Inquiries</p>
                <p className="text-xs text-slate-400">{stats?.unreadInquiries || 0} unread messages</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Tips for Owners</h2>
          <ul className="space-y-3">
            {[
              '📸 Add high-quality photos to get more inquiries',
              '💬 Respond to messages quickly to build trust',
              '🔍 Keep your listing details accurate and up-to-date',
              '⭐ Encourage tenants to leave reviews',
            ].map((tip, i) => (
              <li key={i} className="text-sm text-slate-400 flex gap-2">{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
