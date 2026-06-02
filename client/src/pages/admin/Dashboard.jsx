import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { BarChart2, Users, Building2, AlertTriangle, Clock, CheckCircle, FileText, Zap } from 'lucide-react';

const StatCard = ({ label, value, icon, color, bg, sub }) => (
  <div className="stat-card" style={{ cursor: 'default' }}>
    <div className="flex items-center gap-14" style={{ marginBottom: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ marginLeft: 'auto' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Outfit,sans-serif' }}>{value}</div>
      </div>
    </div>
    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => {
      setStats(res.data.stats);
      setRecentComplaints(res.data.recentComplaints);
    }).catch(() => toast.error('Failed to load dashboard.')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner spinner-lg" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System overview and real-time metrics</p>
        </div>

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <StatCard label="Total Complaints" value={stats.total || 0} icon={<FileText size={20} color="#6366f1" />} color="#6366f1" bg="rgba(99,102,241,0.1)" />
          <StatCard label="Pending" value={stats.pending || 0} icon={<Clock size={20} color="#f59e0b" />} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
          <StatCard label="Resolved" value={stats.resolved || 0} icon={<CheckCircle size={20} color="#10b981" />} color="#10b981" bg="rgba(16,185,129,0.1)" />
          <StatCard label="SLA Breached" value={stats.slaBreached || 0} icon={<AlertTriangle size={20} color="#ef4444" />} color="#ef4444" bg="rgba(239,68,68,0.1)" sub="Needs attention" />
        </div>
        <div className="grid-3" style={{ marginBottom: 28 }}>
          <StatCard label="Assigned" value={stats.assigned || 0} icon={<Zap size={20} color="#3b82f6" />} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
          <StatCard label="Registered Citizens" value={stats.totalUsers || 0} icon={<Users size={20} color="#8b5cf6" />} color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
          <StatCard label="Departments" value={stats.departments || 0} icon={<Building2 size={20} color="#06b6d4" />} color="#06b6d4" bg="rgba(6,182,212,0.1)" />
        </div>

        {/* Recent complaints */}
        <div className="glass" style={{ padding: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 18 }}>Recent Complaints</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Citizen</th><th>Time</th></tr></thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c._id}>
                    <td style={{ maxWidth: 220 }} className="truncate"><a href={`/complaints/${c._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{c.title}</a></td>
                    <td><CategoryBadge category={c.category} /></td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: 13 }}>{c.isAnonymous ? 'Anonymous' : c.user?.name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
