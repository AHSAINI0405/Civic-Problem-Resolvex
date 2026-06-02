import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Search, ChevronDown } from 'lucide-react';

const STATUSES = ['', 'pending', 'assigned', 'in_progress', 'resolved', 'rejected'];
const CATEGORIES = ['', 'roads', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'noise', 'animals', 'other'];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignDeptId, setAssignDeptId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const [cRes, dRes] = await Promise.all([api.get(`/admin/complaints?${params}`), api.get('/admin/departments')]);
      setComplaints(cRes.data.complaints);
      setTotal(cRes.data.total);
      setDepartments(dRes.data.departments);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  const handleAssign = async () => {
    if (!assignDeptId) return toast.error('Select a department.');
    setActionLoading(true);
    try {
      await api.put(`/complaints/${selectedComplaint._id}/assign`, { departmentId: assignDeptId });
      toast.success('Complaint assigned!');
      setSelectedComplaint(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign.'); }
    finally { setActionLoading(false); }
  };

  const handleStatus = async () => {
    if (!newStatus) return toast.error('Select a status.');
    setActionLoading(true);
    try {
      await api.put(`/complaints/${selectedComplaint._id}/status`, { status: newStatus, remarks });
      toast.success('Status updated!');
      setSelectedComplaint(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status.'); }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <h1 className="page-title">Manage Complaints</h1>
          <p className="page-subtitle">{total} total complaints</p>
        </div>

        {/* Filters */}
        <div className="glass-sm flex flex-wrap gap-3 items-center" style={{ padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <select className="form-input" style={{ flex: '0 1 140px' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Status'}</option>)}
          </select>
          <select className="form-input" style={{ flex: '0 1 140px' }} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.replace('_', ' ') : 'All Categories'}</option>)}
          </select>
          <select className="form-input" style={{ flex: '0 1 120px' }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            {['', 'low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p || 'All Priority'}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', category: '', priority: '', search: '' })} className="btn btn-ghost btn-sm">Clear</button>
        </div>

        {/* Table */}
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Citizen</th><th>Assigned To</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
                ) : complaints.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No complaints found.</td></tr>
                ) : complaints.map(c => (
                  <tr key={c._id}>
                    <td style={{ maxWidth: 200 }}>
                      <a href={`/complaints/${c._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }} className="truncate" title={c.title}>{c.title}</a>
                    </td>
                    <td><CategoryBadge category={c.category} /></td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.isAnonymous ? 'Anon' : c.user?.name}</td>
                    <td style={{ fontSize: 13 }}>{c.assignedTo?.name || <span className="text-muted">—</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                    <td>
                      <button onClick={() => { setSelectedComplaint(c); setAssignDeptId(''); setNewStatus(''); setRemarks(''); }}
                        className="btn btn-ghost btn-sm">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2" style={{ marginTop: 20 }}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-ghost btn-sm">← Prev</button>
          <span className="btn btn-ghost btn-sm" style={{ cursor: 'default' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={complaints.length < 15} className="btn btn-ghost btn-sm">Next →</button>
        </div>
      </div>

      {/* Action Modal */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelectedComplaint(null)}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{selectedComplaint.title}</h3>
            <div className="flex gap-2 flex-wrap" style={{ marginBottom: 20 }}>
              <CategoryBadge category={selectedComplaint.category} />
              <StatusBadge status={selectedComplaint.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Assign dept */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Assign to Department</label>
                <div className="flex gap-2">
                  <select className="form-input" style={{ flex: 1 }} value={assignDeptId} onChange={e => setAssignDeptId(e.target.value)}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                  <button onClick={handleAssign} disabled={actionLoading || !assignDeptId} className="btn btn-primary btn-sm">
                    {actionLoading ? <span className="spinner" /> : 'Assign'}
                  </button>
                </div>
              </div>

              <div className="divider" />

              {/* Update status */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Update Status</label>
                <select className="form-input" style={{ marginBottom: 10 }} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select status...</option>
                  {STATUSES.filter(s => s).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <textarea className="form-input" rows={2} placeholder="Remarks (optional)..." value={remarks} onChange={e => setRemarks(e.target.value)} style={{ marginBottom: 10 }} />
                <button onClick={handleStatus} disabled={actionLoading || !newStatus} className="btn btn-primary btn-sm">
                  {actionLoading ? <span className="spinner" /> : 'Update Status'}
                </button>
              </div>
            </div>

            <button onClick={() => setSelectedComplaint(null)} className="btn btn-ghost btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
