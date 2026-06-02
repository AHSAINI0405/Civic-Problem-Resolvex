import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ThumbsUp, MessageCircle, MapPin, Clock, User, Send, Share2, CheckCircle, Circle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const STATUS_STEPS = ['pending', 'assigned', 'in_progress', 'resolved'];
const STATUS_LABELS = { pending: 'Submitted', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' };

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data.complaint);
        setComments(res.data.comments);
      } catch { toast.error('Complaint not found.'); navigate(-1); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleUpvote = async () => {
    try {
      const res = await api.post(`/complaints/${id}/upvote`);
      setComplaint(c => ({ ...c, upvoteCount: res.data.upvoteCount }));
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/complaints/${id}/comment`, { text: comment });
      setComments(prev => [...prev, res.data.comment]);
      setComment('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment.'); }
    finally { setSubmitting(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard! 📋');
  };

  if (loading) return <div className="page-loader"><span className="spinner spinner-lg" /></div>;
  if (!complaint) return null;

  const { title, description, category, priority, status, location, images, upvoteCount, isAnonymous, createdAt, timeline, assignedTo, departmentRemarks, aiSuggestion, slaDeadline, slaBreached, proofImages } = complaint;
  const currentStepIdx = STATUS_STEPS.indexOf(status === 'rejected' ? 'pending' : status);
  const lat = location?.coordinates?.[1] || 20.59;
  const lng = location?.coordinates?.[0] || 78.96;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header card */}
            <div className="glass" style={{ padding: 28 }}>
              <div className="flex gap-2 flex-wrap" style={{ marginBottom: 14 }}>
                <CategoryBadge category={category} />
                <PriorityBadge priority={priority} />
                <StatusBadge status={status} />
                {slaBreached && status !== 'resolved' && status !== 'rejected' && (
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    ⚠️ SLA Breached
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{title}</h1>
              <p className="text-muted" style={{ lineHeight: 1.7, fontSize: 14 }}>{description}</p>

              {/* AI Suggestion box */}
              {aiSuggestion?.reason && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13 }}>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Smart Analysis: </span>
                  <span className="text-muted">{aiSuggestion.reason}</span>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-solid)' }}>
                <button onClick={handleUpvote} className="btn btn-ghost btn-sm flex items-center gap-1">
                  <ThumbsUp size={14} /> {upvoteCount || 0} Upvotes
                </button>
                <button onClick={handleShare} className="btn btn-ghost btn-sm flex items-center gap-1">
                  <Share2 size={14} /> Share
                </button>
                {location?.address && (
                  <span className="flex items-center gap-1 text-sm text-muted"><MapPin size={13} />{location.address}</span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted"><Clock size={13} />{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Images */}
            {images?.length > 0 && (
              <div className="glass" style={{ padding: 20 }}>
                <h3 className="section-title">Attached Images</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {images.map((img, i) => (
                    <img key={i} src={img.url} alt={`img-${i}`} style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-solid)' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Proof Images */}
            {status === 'resolved' && proofImages?.length > 0 && (
              <div className="glass" style={{ padding: 20, border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.03)' }}>
                <h3 className="section-title" style={{ color: '#10b981' }}>✅ Resolution Proof</h3>
                {departmentRemarks && (
                  <p className="text-muted text-sm" style={{ marginBottom: 12, fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                    "{departmentRemarks}"
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {proofImages.map((img, i) => (
                    <img key={i} src={typeof img === 'string' ? img : img.url || img} alt={`resolution-proof-${i}`} style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {lat && lng && (lat !== 0 || lng !== 0) && (
              <div className="glass" style={{ padding: 20 }}>
                <h3 className="section-title">Location</h3>
                <div style={{ height: 220, borderRadius: 10, overflow: 'hidden' }}>
                  <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lat, lng]} />
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="glass" style={{ padding: 24 }}>
              <h3 className="section-title" style={{ marginBottom: 20 }}><MessageCircle size={16} style={{ display: 'inline', marginRight: 6 }} />Comments ({comments.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {comments.length === 0 ? (
                  <p className="text-muted text-sm">No comments yet. Be the first to comment.</p>
                ) : comments.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {c.isAnonymous ? '?' : c.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.isAnonymous ? 'Anonymous' : c.user?.name}</span>
                        <span className="text-muted text-xs">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                        {c.user?.role !== 'citizen' && <span className="badge badge-assigned" style={{ fontSize: 10, padding: '2px 7px' }}>{c.user?.role}</span>}
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} className="flex gap-2">
                <input className="form-input" style={{ flex: 1 }} placeholder="Write a comment..." value={comment} onChange={e => setComment(e.target.value)} />
                <button type="submit" disabled={submitting} className="btn btn-primary btn-icon"><Send size={15} /></button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* SLA Deadline Tracker */}
            {slaDeadline && (
              <div className="glass" style={{ padding: 20 }}>
                <h3 className="section-title">SLA Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div className="flex justify-between">
                    <span className="text-muted">Target Resolution:</span>
                    <span style={{ fontWeight: 500 }}>{format(new Date(slaDeadline), 'MMM d, yyyy')}</span>
                  </div>
                  {slaBreached && status !== 'resolved' && status !== 'rejected' && (
                    <div style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      ⚠️ Resolution is past deadline
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline tracker */}
            <div className="glass" style={{ padding: 22 }}>
              <h3 className="section-title">Status Timeline</h3>
              <div style={{ position: 'relative' }}>
                {STATUS_STEPS.map((s, i) => {
                  const done = i <= currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={s} style={{ display: 'flex', gap: 12, paddingBottom: i < STATUS_STEPS.length - 1 ? 24 : 0, position: 'relative' }}>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{ position: 'absolute', left: 10, top: 22, width: 2, height: 'calc(100% - 6px)', background: done ? 'var(--primary)' : 'var(--border-solid)', borderRadius: 2 }} />
                      )}
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--bg3)', border: `2px solid ${done ? 'var(--primary)' : 'var(--border-solid)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                        {done ? <CheckCircle size={12} color="#fff" /> : <Circle size={10} color="var(--text-faint)" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: active ? 600 : 400, fontSize: 13, color: active ? 'var(--primary)' : done ? 'var(--text)' : 'var(--text-muted)' }}>{STATUS_LABELS[s]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline entries */}
              {timeline?.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-solid)' }}>
                  <p className="text-muted text-xs" style={{ marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Activity Log</p>
                  {[...timeline].reverse().map((t, i) => (
                    <div key={i} style={{ marginBottom: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{t.status?.replace('_', ' ')}: </span>
                      {t.message} · {t.updatedAt ? format(new Date(t.updatedAt), 'MMM d, h:mm a') : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dept info */}
            {assignedTo && (
              <div className="glass" style={{ padding: 20 }}>
                <h3 className="section-title">Assigned Department</h3>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', margin: 0 }}>{assignedTo.name}</p>
                {assignedTo.head && <p className="text-muted text-sm" style={{ marginTop: 6, fontSize: 12 }}>Head: <strong>{assignedTo.head}</strong></p>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, borderTop: '1px solid var(--border-solid)', paddingTop: 12 }}>
                  {assignedTo.email && (
                    <a href={`mailto:${assignedTo.email}`} className="text-muted text-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      📧 {assignedTo.email}
                    </a>
                  )}
                  {assignedTo.phone && (
                    <a href={`tel:${assignedTo.phone}`} className="text-muted text-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      📞 {assignedTo.phone}
                    </a>
                  )}
                </div>
                
                {departmentRemarks && status !== 'resolved' && (
                  <p className="text-muted text-sm" style={{ marginTop: 12, borderTop: '1px solid var(--border-solid)', paddingTop: 10, fontSize: 12, fontStyle: 'italic' }}>
                    <strong>Latest Remarks:</strong> {departmentRemarks}
                  </p>
                )}
              </div>
            )}

            {/* Submitter */}
            <div className="glass" style={{ padding: 20 }}>
              <h3 className="section-title">Submitted By</h3>
              <div className="flex items-center gap-10">
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {isAnonymous ? '?' : complaint.user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{isAnonymous ? 'Anonymous Citizen' : complaint.user?.name}</p>
                  <p className="text-muted text-xs">{format(new Date(createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
