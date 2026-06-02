import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Search, MapPin, MessageCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DeptAssigned() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/department/assigned?page=${page}&limit=12${statusFilter ? `&status=${statusFilter}` : ''}`);
      setComplaints(res.data.complaints);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load assigned complaints.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, [page, statusFilter]);

  const DeptComplaintCard = ({ c }) => (
    <div className="card fade-in-up" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="flex justify-between items-center">
        <div className="flex gap-2"><CategoryBadge category={c.category} /><PriorityBadge priority={c.priority} /></div>
        <StatusBadge status={c.status} />
      </div>
      <Link to={`/dept/complaints/${c._id}`} style={{ textDecoration: 'none' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{c.title}</h3>
      </Link>
      <p className="text-muted text-sm line-clamp-2" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
      
      {c.location?.address && <div className="text-muted text-sm flex items-center gap-1"><MapPin size={13}/> {c.location.address}</div>}

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-solid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-xs text-muted">Assigned: {c.assignedAt ? formatDistanceToNow(new Date(c.assignedAt), { addSuffix: true }) : 'N/A'}</span>
        <Link to={`/dept/complaints/${c._id}`} className="btn btn-primary btn-sm">Manage →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="page-title">Assigned Complaints</h1>
            <p className="page-subtitle">Manage and resolve issues assigned to your department</p>
          </div>
          <select className="form-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="assigned">Assigned (New)</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 64 }}><span className="spinner spinner-lg" /></div>
          : complaints.length === 0 ? <div className="empty-state"><FileText size={48} /><p>No complaints assigned yet.</p></div>
          : (
            <>
              <div className="grid-3" style={{ gap: 20 }}>{complaints.map(c => <DeptComplaintCard key={c._id} c={c} />)}</div>
              <div className="flex justify-center gap-2" style={{ marginTop: 28 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-ghost btn-sm">← Prev</button>
                <span className="btn btn-ghost btn-sm">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={complaints.length < 12} className="btn btn-ghost btn-sm">Next →</button>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
