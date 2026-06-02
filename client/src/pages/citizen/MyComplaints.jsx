import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import ComplaintCard from '../../components/ComplaintCard';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Filter } from 'lucide-react';

const STATUSES = ['', 'pending', 'assigned', 'in_progress', 'resolved', 'rejected'];
const CATEGORIES = ['', 'roads', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'noise', 'animals', 'other'];

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/complaints?${params}`);
      setComplaints(res.data.complaints);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load complaints.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, [page, filters]);

  const handleUpvote = async (id) => {
    try {
      const res = await api.post(`/complaints/${id}/upvote`);
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, upvoteCount: res.data.upvoteCount } : c));
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header flex justify-between items-center flex-wrap gap-4">
          <div><h1 className="page-title">My Complaints</h1><p className="page-subtitle">{total} total complaints</p></div>
        </div>

        {/* Filters */}
        <div className="glass-sm flex flex-wrap gap-3 items-center" style={{ padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search complaints..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <select className="form-input" style={{ flex: '0 1 160px' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Status'}</option>)}
          </select>
          <select className="form-input" style={{ flex: '0 1 160px' }} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.replace('_', ' ') : 'All Categories'}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', category: '', search: '' })} className="btn btn-ghost btn-sm">Clear</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64 }}><span className="spinner spinner-lg" /></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: 52 }}>📭</div><p>No complaints found.</p></div>
        ) : (
          <>
            <div className="grid-3" style={{ gap: 18 }}>
              {complaints.map(c => <ComplaintCard key={c._id} complaint={c} onUpvote={handleUpvote} />)}
            </div>
            {/* Pagination */}
            <div className="flex justify-center gap-2" style={{ marginTop: 28 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-ghost btn-sm">← Prev</button>
              <span className="btn btn-ghost btn-sm" style={{ cursor: 'default' }}>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={complaints.length < 9} className="btn btn-ghost btn-sm">Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
