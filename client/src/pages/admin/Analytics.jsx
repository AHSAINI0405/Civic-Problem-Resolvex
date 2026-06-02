import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#64748b'];

export default function AdminAnalytics() {
  const [data, setData] = useState({ categoryData: [], monthlyTrend: [], statusData: [], priorityData: [], deptPerformance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data)).catch(() => toast.error('Failed to load analytics.')).finally(() => setLoading(false));
  }, []);

  const formatMonthlyTrend = (trendData) => trendData.map(d => ({
    name: `${format(new Date(d._id.year, d._id.month - 1), 'MMM yyyy')}`,
    Total: d.count,
    Resolved: d.resolved
  }));

  if (loading) return <div className="page-loader"><span className="spinner spinner-lg" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">Data-driven insights into civic issues</p>
        </div>

        <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
          {/* Monthly Trend */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 className="section-title">Complaints Over Time (Last 6 Months)</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatMonthlyTrend(data.monthlyTrend)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-solid)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border-solid)', borderRadius: 8, color: 'var(--text)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 className="section-title">Complaints by Category</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="count" nameKey="_id" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border-solid)', borderRadius: 8 }} itemStyle={{ color: 'var(--text)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 className="section-title">Status Distribution</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-solid)" />
                  <XAxis dataKey="_id" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border-solid)', borderRadius: 8 }} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="section-title">Priority Distribution</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-solid)" />
                  <XAxis dataKey="_id" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border-solid)', borderRadius: 8 }} cursor={{ fill: 'rgba(245,158,11,0.1)' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>Department Performance Metrics</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Department</th><th>Total Assigned</th><th>Resolved</th><th>Resolution Rate</th><th>Avg Resolution Time</th><th>SLA Breaches</th></tr></thead>
              <tbody>
                {data.deptPerformance.map(d => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.totalAssigned}</td>
                    <td style={{ color: 'var(--success)' }}>{d.totalResolved}</td>
                    <td>{d.totalAssigned ? Math.round((d.totalResolved / d.totalAssigned) * 100) : 0}%</td>
                    <td>{d.avgResolutionDays} days</td>
                    <td style={{ color: d.slaBreach > 0 ? 'var(--danger)' : 'inherit' }}>{d.slaBreach}</td>
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
