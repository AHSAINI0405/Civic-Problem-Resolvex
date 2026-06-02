import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { CheckCircle, AlertCircle, Play, Upload, X } from 'lucide-react';
import { format } from 'date-fns';

export default function DeptComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [proofImages, setProofImages] = useState([]);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setC(res.data.complaint);
    } catch { toast.error('Not found.'); navigate('/dept/assigned'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  const handleAction = async (endpoint, payload = {}, isFormData = false) => {
    setActionLoading(true);
    try {
      let config = {};
      if (isFormData) config.headers = { 'Content-Type': 'multipart/form-data' };
      await api.put(`/department/complaints/${id}/${endpoint}`, payload, config);
      toast.success('Complaint updated!');
      fetchComplaint();
      setRemarks('');
      setProofImages([]);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
    finally { setActionLoading(false); }
  };

  const submitProgress = () => {
    const fd = new FormData();
    fd.append('remarks', remarks);
    proofImages.forEach(f => fd.append('proofImages', f));
    handleAction('progress', fd, true);
  };

  if (loading) return <div className="page-loader"><span className="spinner spinner-lg" /></div>;
  if (!c) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <button onClick={() => navigate('/dept/assigned')} className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>← Back</button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          {/* Main Info */}
          <div className="flex-col gap-4">
            <div className="glass" style={{ padding: 28 }}>
              <div className="flex gap-2 mb-4"><CategoryBadge category={c.category}/><PriorityBadge priority={c.priority}/><StatusBadge status={c.status}/></div>
              <h1 className="text-xl font-bold mb-3">{c.title}</h1>
              <p className="text-muted text-sm">{c.description}</p>
              
              {c.images?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p className="text-sm font-semibold mb-2">Citizen Uploads</p>
                  <div className="flex gap-2 flex-wrap">{c.images.map((img, i) => <img key={i} src={img.url} alt="upload" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8 }}/>)}</div>
                </div>
              )}
            </div>

            {/* Department Actions */}
            {c.status !== 'resolved' && c.status !== 'rejected' && (
              <div className="glass" style={{ padding: 28 }}>
                <h3 className="section-title">Department Actions</h3>
                
                {c.status === 'assigned' && (
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => handleAction('accept')} disabled={actionLoading} className="btn btn-primary"><Play size={15}/> Accept & Start Work</button>
                    <button onClick={() => { const r = prompt('Reason for rejection:'); if (r) handleAction('reject', { reason: r }); }} disabled={actionLoading} className="btn btn-danger"><X size={15}/> Reject</button>
                  </div>
                )}

                {c.status === 'in_progress' && (
                  <div className="flex-col gap-4 mt-2">
                    <textarea className="form-input" rows={3} placeholder="Add progress remarks or final resolution notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                    
                    <div>
                      <label className="form-label mb-2 block">Upload Proof Images (Optional)</label>
                      <input type="file" multiple accept="image/*" onChange={e => setProofImages(Array.from(e.target.files))} />
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button onClick={submitProgress} disabled={actionLoading || (!remarks && !proofImages.length)} className="btn btn-outline"><Upload size={15}/> Update Progress</button>
                      <button onClick={() => handleAction('complete', { remarks })} disabled={actionLoading || !remarks} className="btn btn-success"><CheckCircle size={15}/> Mark as Resolved</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 className="section-title">Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {c.timeline?.slice().reverse().map((t, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 14, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }}/>
                  <p className="text-sm font-semibold">{t.status.replace('_', ' ')}</p>
                  <p className="text-xs text-muted mt-1">{t.message}</p>
                  <p className="text-xs text-faint mt-1">{format(new Date(t.updatedAt), 'MMM d, h:mm a')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
