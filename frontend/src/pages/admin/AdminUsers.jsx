import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../api';
import { Users, CheckCircle, XCircle, Trash2, Loader, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['', 'user', 'owner', 'admin'];

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page,  setPage]      = useState(1);
  const [role,  setRole]      = useState(searchParams.get('role') || '');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = async (pg = page, rl = role) => {
    setLoading(true);
    try {
      const res = await adminAPI.users({ page: pg, limit: 15, ...(rl ? { role: rl } : {}) });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, role); }, [role]);

  const approveOwner = async (id, action) => {
    setProcessing(id + action);
    try {
      await adminAPI.approveOwner(id, action);
      toast.success(`Owner ${action} successfully`);
      load(page, role);
    } catch { toast.error('Action failed'); }
    finally { setProcessing(null); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setProcessing(id + 'del');
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      load(page, role);
    } catch { toast.error('Delete failed'); }
    finally { setProcessing(null); }
  };

  const APPROVAL_COLOR = {
    approved: 'badge-success',
    pending:  'badge-warning',
    rejected: 'badge-danger',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button key={r || 'all'} onClick={() => { setRole(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  role === r ? 'gradient-primary text-white border-transparent' : 'border-[var(--border)] text-slate-400 hover:text-white'
                }`}>
                {r || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'owner' ? 'badge-warning' : 'badge-primary'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${APPROVAL_COLOR[u.isApproved] || 'badge-primary'}`}>{u.isApproved}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {u.role === 'owner' && u.isApproved === 'pending' && (
                        <>
                          <button
                            onClick={() => approveOwner(u.id, 'approved')}
                            disabled={!!processing}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                            style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                            {processing === u.id + 'approved' ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => approveOwner(u.id, 'rejected')}
                            disabled={!!processing}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                            {processing === u.id + 'rejected' ? <Loader size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </>
                      )}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={!!processing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                          {processing === u.id + 'del' ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-16 text-slate-500">No users found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setPage(p); load(p, role); }}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === page ? 'gradient-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
