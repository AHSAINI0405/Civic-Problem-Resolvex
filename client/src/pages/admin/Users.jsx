import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Search, Shield, ShieldOff } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(roleFilter && { role: roleFilter }) });
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users); setTotal(res.data.total);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const handleBlock = async (userId, isBlocked) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
      toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'}!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
  };

  const ROLE_COLORS = { citizen: '#6366f1', admin: '#ef4444', department: '#10b981' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{total} registered users</p>
        </div>
        <div className="glass-sm flex flex-wrap gap-3 items-center" style={{ padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ flex: '0 1 140px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {['citizen', 'admin', 'department'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
                  : users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${ROLE_COLORS[u.role]},#8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>{u.name?.[0]?.toUpperCase()}</div>
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                      <td><span className="badge" style={{ background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role] }}>{u.role}</span></td>
                      <td><span className={`badge ${u.isVerified ? 'badge-resolved' : 'badge-pending'}`}>{u.isVerified ? '✓ Verified' : 'Pending'}</span></td>
                      <td><span className={`badge ${u.isBlocked ? 'badge-rejected' : 'badge-resolved'}`}>{u.isBlocked ? 'Blocked' : 'Active'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                      <td>{u.role !== 'admin' && (
                        <button onClick={() => handleBlock(u._id, u.isBlocked)} className={`btn btn-sm ${u.isBlocked ? 'btn-success' : 'btn-danger'}`}>
                          {u.isBlocked ? <><Shield size={12} /> Unblock</> : <><ShieldOff size={12} /> Block</>}
                        </button>
                      )}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-center gap-2" style={{ marginTop: 20 }}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-ghost btn-sm">← Prev</button>
          <span className="btn btn-ghost btn-sm" style={{ cursor: 'default' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} className="btn btn-ghost btn-sm">Next →</button>
        </div>
      </div>
    </div>
  );
}
