import { useState, useEffect } from 'react';
import { notificationAPI } from '../api';
import { Bell, BellOff, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationAPI.getAll()
      .then(r => setNotifications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Bell size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-indigo-400" /></div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`glass-card p-4 flex gap-4 items-start transition-all ${!n.isRead ? 'border-indigo-500/30' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? 'bg-slate-600' : 'bg-indigo-400'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)} className="text-indigo-400 hover:text-indigo-300 flex-shrink-0" title="Mark as read">
                  <CheckCircle size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BellOff size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
          <p className="text-slate-400">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
