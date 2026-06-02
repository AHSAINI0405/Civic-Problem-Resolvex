import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart2, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';

const StatCard = ({ label, value, icon, color, bg }) => (
  <div className="stat-card flex items-center gap-4">
    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div><div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Outfit,sans-serif' }}>{value}</div><div className="text-muted text-sm">{label}</div></div>
  </div>
);

export default function DeptPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/department/performance').then(res => setData(res.data)).catch(() => toast.error('Failed to load performance metrics.')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner spinner-lg" /></div>;

  const { department: dept, stats } = data;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header mb-6">
          <h1 className="page-title">{dept.name}</h1>
          <p className="page-subtitle">Performance Metrics & Workload</p>
        </div>

        <div className="grid-4 mb-6">
          <StatCard label="Total Assigned" value={stats.total} icon={<Zap size={24} color="#3b82f6"/>} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
          <StatCard label="Pending / Assigned" value={stats.pending} icon={<Clock size={24} color="#f59e0b"/>} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle size={24} color="#10b981"/>} color="#10b981" bg="rgba(16,185,129,0.1)" />
          <StatCard label="SLA Breached" value={stats.slaBreached} icon={<AlertTriangle size={24} color="#ef4444"/>} color="#ef4444" bg="rgba(239,68,68,0.1)" />
        </div>

        <div className="grid-2">
          <div className="glass p-6">
            <h3 className="section-title mb-4">Resolution Efficiency</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-4 bg-[var(--bg3)] rounded-lg border border-[var(--border-solid)]">
                <span className="text-muted">Resolution Rate</span>
                <span className="font-bold text-lg text-success">{stats.total ? Math.round((stats.resolved/stats.total)*100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[var(--bg3)] rounded-lg border border-[var(--border-solid)]">
                <span className="text-muted">Average Resolution Time</span>
                <span className="font-bold text-lg text-primary">{dept.avgResolutionDays} days</span>
              </div>
            </div>
          </div>
          
          <div className="glass p-6">
            <h3 className="section-title mb-4">Department Info</h3>
            <div className="text-sm text-muted flex flex-col gap-3">
              <p><strong className="text-[var(--text)]">Categories Handled:</strong> {dept.categories?.join(', ') || 'None'}</p>
              <p><strong className="text-[var(--text)]">Department Head:</strong> {dept.head || 'Not specified'}</p>
              <p><strong className="text-[var(--text)]">Contact Email:</strong> {dept.email || 'N/A'}</p>
              <p><strong className="text-[var(--text)]">Description:</strong> {dept.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
