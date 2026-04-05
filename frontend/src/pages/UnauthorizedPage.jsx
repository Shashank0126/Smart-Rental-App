import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-dark)' }}>
      <div className="max-w-md w-full glass-card p-10 text-center animate-fadeInUp">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}>
          <ShieldX size={36} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8">You don't have permission to view this page.</p>
        <Link to="/" className="btn-primary py-3 px-8">Go Home</Link>
      </div>
    </div>
  );
}
