import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export default function AdminSLA() {
  const [breached, setBreached] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/sla').then(res => {
      setBreached(res.data.breached);
      setAtRisk(res.data.atRisk);
    }).catch(() => toast.error('Failed to load SLA tracking.')).finally(() => setLoading(false));
  }, []);

  const ComplaintRow = ({ c, type }) => (
    <tr>
      <td>
        <a href={`/complaints/${c._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }} className="truncate block" style={{ maxWidth: 200 }} title={c.title}>{c.title}</a>
      </td>
      <td>{c.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
      <td><span className="badge" style={{ background: 'var(--bg3)' }}>{c.status?.replace('_', ' ')}</span></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: type === 'breach' ? 'var(--danger)' : 'var(--warning)', fontSize: 13, fontWeight: 500 }}>
          {type === 'breach' ? <AlertTriangle size={14} /> : <Clock size={14} />}
          {format(new Date(c.slaDeadline), 'MMM d, yyyy')}
        </div>
      </td>
      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {type === 'breach' ? `${formatDistanceToNow(new Date(c.slaDeadline))} overdue` : `Due in ${formatDistanceToNow(new Date(c.slaDeadline))}`}
      </td>
    </tr>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <h1 className="page-title">SLA Tracking</h1>
          <p className="page-subtitle">Monitor service level agreement deadlines</p>
        </div>

        <div className="grid-2" style={{ gap: 24 }}>
          {/* Breached SLA */}
          <div className="glass" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={20} color="#ef4444" />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>SLA Breached ({breached.length})</h3>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {loading ? <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
                : breached.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No breached SLAs! 🎉</div>
                : <table style={{ border: 'none' }}>
                    <thead><tr><th>Complaint</th><th>Department</th><th>Status</th><th>Deadline</th><th>Overdue By</th></tr></thead>
                    <tbody>{breached.map(c => <ComplaintRow key={c._id} c={c} type="breach" />)}</tbody>
                  </table>
              }
            </div>
          </div>

          {/* At Risk SLA */}
          <div className="glass" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} color="#f59e0b" />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>At Risk (Due in 24h) ({atRisk.length})</h3>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {loading ? <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
                : atRisk.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No complaints at risk!</div>
                : <table style={{ border: 'none' }}>
                    <thead><tr><th>Complaint</th><th>Department</th><th>Status</th><th>Deadline</th><th>Due In</th></tr></thead>
                    <tbody>{atRisk.map(c => <ComplaintRow key={c._id} c={c} type="risk" />)}</tbody>
                  </table>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
