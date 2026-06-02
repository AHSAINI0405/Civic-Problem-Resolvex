import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import ComplaintCard from '../../components/ComplaintCard';
import { PlusCircle, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon, color, bg }) => (
  <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      <div className="text-muted text-sm">{label}</div>
    </div>
  </div>
);

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, inProgress: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/complaints?limit=6&sort=-createdAt');
        setComplaints(res.data.complaints);
        const all = res.data.complaints;
        setStats({
          total: res.data.total,
          pending: all.filter(c => c.status === 'pending').length,
          resolved: all.filter(c => c.status === 'resolved').length,
          inProgress: all.filter(c => c.status === 'in_progress').length,
        });
      } catch { toast.error('Failed to load complaints.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleUpvote = async (id) => {
    try {
      const res = await api.post(`/complaints/${id}/upvote`);
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, upvoteCount: res.data.upvoteCount } : c));
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Welcome header */}
        <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 700 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-muted" style={{ marginTop: 4 }}>Here's what's happening with your complaints</p>
          </div>
          <Link to="/raise-complaint" className="btn btn-primary">
            <PlusCircle size={16} /> Raise New Complaint
          </Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          <StatCard label="Total Complaints" value={stats.total} icon="📋" color="var(--primary)" bg="rgba(99,102,241,0.1)" />
          <StatCard label="Pending" value={stats.pending} icon="⏳" color="var(--warning)" bg="rgba(245,158,11,0.1)" />
          <StatCard label="In Progress" value={stats.inProgress} icon="🔨" color="var(--secondary)" bg="rgba(139,92,246,0.1)" />
          <StatCard label="Resolved" value={stats.resolved} icon="✅" color="var(--success)" bg="rgba(16,185,129,0.1)" />
        </div>

        {/* Recent complaints */}
        <div>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h2 className="section-title">My Recent Complaints</h2>
            <Link to="/my-complaints" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner spinner-lg" /></div>
          ) : complaints.length === 0 ? (
            <div className="glass" style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p className="text-muted">No complaints yet. Be the first to report an issue!</p>
              <Link to="/raise-complaint" className="btn btn-primary" style={{ marginTop: 20 }}><PlusCircle size={15} /> Raise a Complaint</Link>
            </div>
          ) : (
            <div className="grid-2">
              {complaints.map(c => <ComplaintCard key={c._id} complaint={c} onUpvote={handleUpvote} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
