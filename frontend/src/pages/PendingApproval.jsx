import { Link } from 'react-router-dom';
import { Clock, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-dark)' }}>
      <div className="max-w-md w-full glass-card p-10 text-center animate-fadeInUp">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}>
          <Clock size={36} className="text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Pending Approval</h1>
        <p className="text-slate-400 mb-2">Your owner account is under review.</p>
        <p className="text-slate-500 text-sm mb-8">
          Our admin team will review your registration and notify you via email once approved. This usually takes 1–2 business days.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/" className="btn-primary py-3">Browse Properties</Link>
          <button onClick={handleLogout} className="btn-ghost py-3 flex items-center justify-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
