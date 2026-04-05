import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Users, Building2, MessageCircle, AlertTriangle, Clock, TrendingUp, Loader, Bell, CheckCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.dashboard(),
      adminAPI.notifications(),
    ]).then(([s, n]) => {
      setStats(s.data);
      setNotifications(n.data);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/admin/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
      toast.success('All marked as read');
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size={36} className="animate-spin text-indigo-400" />
    </div>
  );

  const cards = [
    { label: 'Total Users',    value: stats?.totalUsers,       icon: Users,         color: 'var(--primary)',  href: '/admin/users?role=user' },
    { label: 'Total Owners',   value: stats?.totalOwners,      icon: Building2,     color: 'var(--success)',  href: '/admin/users?role=owner' },
    { label: 'Properties',    value: stats?.totalProperties,   icon: Building2,     color: 'var(--accent)',   href: '/admin/properties' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals, icon: Clock,      color: 'var(--warning)',  href: '/admin/users?role=owner' },
    { label: 'Flagged',        value: stats?.flaggedProperties, icon: AlertTriangle, color: 'var(--danger)',  href: '/admin/properties?flagged=true' },
    { label: 'Messages',       value: stats?.totalMessages,    icon: MessageCircle, color: '#06b6d4',         href: '#' },
  ];

  // Chart data
  const chartData = (stats?.monthlyListings || []).map(m => ({
    name: `${m._id?.month}/${m._id?.year?.toString().slice(-2)}`,
    listings: m.count,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <a key={label} href={href} className="stat-card text-center hover:border-indigo-500/40 block">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{value ?? 0}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-indigo-400" />
            <h2 className="font-semibold text-white">Monthly Property Listings</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }}
                />
                <Bar dataKey="listings" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-slate-500">No data yet</div>
          )}
        </div>

        {/* Notifications */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Notifications</h2>
            </div>
            {notifications.some(n => !n.isRead) && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <CheckCheck size={12} /> All read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 280 }}>
            {notifications.length > 0 ? notifications.slice(0, 10).map(n => (
              <div key={n.id} className={`p-3 rounded-xl text-sm transition-all ${!n.isRead ? 'border-indigo-500/30' : ''}`}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${n.isRead ? 'bg-slate-600' : 'bg-indigo-400'}`} />
                  <div>
                    <p className={`font-medium text-xs ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-slate-500 text-sm py-8">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
