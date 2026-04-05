import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', phone: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill required fields'); return; }
    if (form.password.length < 6) { toast.error('Password min 6 chars'); return; }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome to SmartRental 🎉');
      const role = res.data.user.role;
      if (role === 'owner') navigate('/pending-approval');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--accent)' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--primary)' }} />

      <div className="w-full max-w-md glass-card p-8 animate-fadeInUp relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4" style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join SmartRental today</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          {['user', 'owner'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, role: r })}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                form.role === r
                  ? 'gradient-primary text-white border-transparent shadow-lg'
                  : 'border-[var(--border)] text-slate-400 hover:text-white hover:border-indigo-500'
              }`}
            >
              {r === 'user' ? '🏠 Tenant' : '🏢 Property Owner'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input id="reg-name" name="name" type="text" value={form.name} onChange={handle} placeholder="John Doe" className="input-field pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input id="reg-email" name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" className="input-field pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handle} placeholder="+91 98765 43210" className="input-field pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                id="reg-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handle}
                placeholder="Min 6 characters"
                className="input-field pl-10 pr-10"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {form.role === 'owner' && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs text-amber-400">⚠ Owner accounts require admin approval before you can list properties.</p>
            </div>
          )}

          <button id="reg-submit" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
