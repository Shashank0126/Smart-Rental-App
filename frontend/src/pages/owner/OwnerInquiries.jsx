import { useState, useEffect } from 'react';
import { ownerAPI } from '../../api';
import { MessageCircle, Loader, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OwnerInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    ownerAPI.myInquiries()
      .then(r => setInquiries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size={36} className="animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <MessageCircle size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Property Inquiries</h1>
          <p className="text-slate-400 text-sm">{inquiries.length} message{inquiries.length !== 1 ? 's' : ''} received</p>
        </div>
      </div>

      {inquiries.length > 0 ? (
        <div className="space-y-3">
          {inquiries.map(inq => (
            <div
              key={inq.id}
              onClick={() => navigate(`/chat/${inq.senderId}`)}
              className="glass-card p-5 cursor-pointer hover:border-indigo-500/40 transition-all flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                {inq.senderName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-white">{inq.senderName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(inq.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-slate-400 truncate">{inq.message}</p>
                {!inq.isRead && (
                  <span className="inline-block mt-1 w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </div>
              <ChevronRight size={18} className="text-slate-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <MessageCircle size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No inquiries yet</h3>
          <p className="text-slate-400">Tenants will contact you here about your properties.</p>
        </div>
      )}
    </div>
  );
}
