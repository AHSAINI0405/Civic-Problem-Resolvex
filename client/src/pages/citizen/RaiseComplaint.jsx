import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Cpu, MapPin, Upload, X, Send, ChevronRight, CheckCircle } from 'lucide-react';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const STEPS = ['Details', 'Location', 'Media', 'Review'];
const CATEGORIES = ['roads', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'noise', 'animals', 'other'];
const CATEGORY_ICONS = { roads: '🛣️', water: '💧', electricity: '⚡', sanitation: '🗑️', public_safety: '🛡️', parks: '🌳', noise: '🔊', animals: '🐾', other: '📋' };
const CHAT_OPTIONS = [
  "How do I file a complaint?",
  "What issues can I report?",
  "How long does resolution take?",
  "Can I track my complaint?"
];

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng); } });
  return null;
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RaiseComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', content: "Hi! Need help filing your complaint? Tell me what issue you're facing." }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium', isAnonymous: false, address: '', lat: 20.5937, lng: 78.9629 });
  const [files, setFiles] = useState({ images: [], videos: [] });
  const [markerPos, setMarkerPos] = useState(null);

  // Debounced AI suggestion
  useEffect(() => {
    if (form.description.length < 20) { setSuggestion(''); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.post('/ai/suggest', { text: form.title + ' ' + form.description });
        setSuggestion(res.data.suggestion);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [form.description, form.title]);

  const classifyWithAI = async () => {
    if (!form.title || !form.description) return toast.error('Enter title and description first.');
    setAiLoading(true);
    try {
      const res = await api.post('/ai/classify', { title: form.title, description: form.description });
      setAiResult(res.data);
      setForm(f => ({ ...f, category: res.data.category, priority: res.data.priority }));
      toast.success('Complaint analyzed successfully!');
    } catch { toast.error('AI classification failed. Manual selection used.'); }
    finally { setAiLoading(false); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      setMarkerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      toast.success('Location detected! 📍');
    }, () => toast.error('Could not detect location.'));
  };

  const handleMapClick = (latlng) => {
    setMarkerPos(latlng);
    setForm(f => ({ ...f, lat: latlng.lat, lng: latlng.lng }));
  };

  const searchAddress = async () => {
    if (!form.address) return toast.error('Enter an address first.');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setForm(f => ({ ...f, lat, lng }));
        setMarkerPos({ lat, lng });
        toast.success('Location found! 📍');
      } else {
        toast.error('Location not found.');
      }
    } catch {
      toast.error('Failed to search location.');
    }
  };

  const handleFileChange = (e, type) => {
    const selected = Array.from(e.target.files);
    setFiles(f => ({ ...f, [type]: [...f[type], ...selected].slice(0, type === 'images' ? 5 : 2) }));
  };

  const removeFile = (type, idx) => setFiles(f => ({ ...f, [type]: f[type].filter((_, i) => i !== idx) }));

  const sendChat = async (textOverride) => {
    const text = typeof textOverride === 'string' ? textOverride : chatInput;
    if (!text.trim()) return;
    const msgs = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(msgs);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.post('/ai/chatbot', { messages: msgs });
      setChatMessages([...msgs, { role: 'assistant', content: res.data.reply }]);
    } catch { setChatMessages([...msgs, { role: 'assistant', content: "Sorry, I'm having trouble. Please try again." }]); }
    finally { setChatLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return toast.error('Title and description are required.');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.images.forEach(f => fd.append('images', f));
      files.videos.forEach(f => fd.append('videos', f));
      const res = await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint raised successfully! 🎉');
      navigate(`/complaints/${res.data.complaint._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit complaint.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 className="page-title">Raise a Complaint</h1>
            <p className="text-muted text-sm">Automatically analyze and prioritize your complaint.</p>
          </div>

          {/* Steps */}
          <div className="flex gap-2" style={{ marginBottom: 32, flexWrap: 'wrap' }}>
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: i === step ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : i < step ? 'rgba(16,185,129,0.15)' : 'var(--bg3)', color: i === step ? '#fff' : i < step ? 'var(--success)' : 'var(--text-muted)' }}>
                  {i < step ? <CheckCircle size={14} /> : <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === step ? 'rgba(255,255,255,0.2)' : 'var(--bg4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{i + 1}</span>}
                  {s}
                </div>
                {i < STEPS.length - 1 && <ChevronRight size={14} color="var(--text-faint)" />}
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
            <div>
              {/* Step 0: Details */}
              {step === 0 && (
                <div className="glass" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="form-group">
                      <label className="form-label">Complaint Title *</label>
                      <input className="form-input" placeholder="e.g. Large pothole on Main Street" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description *</label>
                      <textarea className="form-input" rows={5} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                      {suggestion && (
                        <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12, color: '#a5b4fc', display: 'flex', gap: 6 }}>
                          <Cpu size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {suggestion}
                        </div>
                      )}
                    </div>

                    {/* AI Classify */}
                    <button onClick={classifyWithAI} disabled={aiLoading} className="btn btn-outline" style={{ width: 'fit-content' }}>
                      {aiLoading ? <><span className="spinner" /> Analyzing...</> : <><Cpu size={15} /> Analyze & Auto-Classify</>}
                    </button>

                    {aiResult && (
                      <div style={{
                        padding: 18,
                        background: aiResult.isSpam ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16,185,129,0.08)',
                        border: aiResult.isSpam ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 12,
                        fontSize: 13,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        <div className="flex justify-between items-center">
                          <p style={{ color: aiResult.isSpam ? '#ef4444' : '#10b981', fontWeight: 600, margin: 0 }}>
                            {aiResult.isSpam ? 'Spam Alert' : 'Analysis Result'}
                          </p>
                          {aiResult.confidence && (
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 8, color: 'var(--text-muted)' }}>
                              Confidence: {(aiResult.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <p className="text-muted" style={{ margin: 0 }}>
                          Suggested Category: <strong style={{ color: 'var(--text)' }}>{form.category}</strong> · Priority: <strong style={{ color: 'var(--text)' }}>{form.priority}</strong>
                        </p>
                        
                        {aiResult.reason && <p className="text-muted" style={{ marginTop: 2, margin: 0, fontSize: 12 }}>{aiResult.reason}</p>}
                        
                        {aiResult.suggestion && (
                          <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12, border: '1px solid var(--border-solid)', marginTop: 4 }}>
                            <strong style={{ color: 'var(--text)' }}>Suggestion:</strong> {aiResult.suggestion}
                          </div>
                        )}

                        {aiResult.isSpam && (
                          <p style={{ color: '#ef4444', fontWeight: 500, margin: '4px 0 0 0', fontSize: 12 }}>
                            ⚠️ Warning: This complaint was classified as potential spam ({aiResult.spamReason}). Please revise.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Manual category */}
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', borderColor: form.category === cat ? 'var(--primary)' : 'var(--border-solid)', background: form.category === cat ? 'rgba(99,102,241,0.15)' : 'var(--bg3)', color: form.category === cat ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {CATEGORY_ICONS[cat]} {cat.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({ ...form, isAnonymous: e.target.checked })} />
                      <span className="text-muted">Submit anonymously</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 1: Location */}
              {step === 1 && (
                <div className="glass" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <button onClick={detectLocation} className="btn btn-outline" style={{ width: 'fit-content' }}>
                      <MapPin size={15} /> Detect My Location
                    </button>
                    <div className="form-group">
                      <label className="form-label">Address / Landmark</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input" style={{ flex: 1 }} placeholder="e.g. Near City Hall, Main Street" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        <button onClick={searchAddress} className="btn btn-outline" style={{ padding: '0 16px' }}>Search</button>
                      </div>
                    </div>
                    <div style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-solid)' }}>
                      <MapContainer center={[form.lat, form.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <MapUpdater center={markerPos || [form.lat, form.lng]} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                        <MapClickHandler onLocationSelect={handleMapClick} />
                        {markerPos && <Marker position={markerPos} />}
                      </MapContainer>
                    </div>
                    <p className="text-muted text-sm">Click on the map to pin the exact location of the issue.</p>
                  </div>
                </div>
              )}

              {/* Step 2: Media */}
              {step === 2 && (
                <div className="glass" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Upload Images (max 5)</label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24, border: '2px dashed var(--border-solid)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-solid)'}>
                        <Upload size={24} color="var(--text-muted)" />
                        <span className="text-muted text-sm">Click to upload images</span>
                        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileChange(e, 'images')} />
                      </label>
                      {files.images.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {files.images.map((f, i) => (
                            <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-solid)' }}>
                              <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button onClick={() => removeFile('images', i)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 2, display: 'flex' }}>
                                <X size={10} color="#fff" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Upload Video (max 1, 30MB)</label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24, border: '2px dashed var(--border-solid)', borderRadius: 12, cursor: 'pointer' }}>
                        <Upload size={24} color="var(--text-muted)" />
                        <span className="text-muted text-sm">Click to upload video</span>
                        <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'videos')} />
                      </label>
                      {files.videos.map((f, i) => (
                        <div key={i} className="flex items-center gap-2" style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                          <span className="text-sm">{f.name}</span>
                          <button onClick={() => removeFile('videos', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}><X size={14} color="var(--danger)" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="glass" style={{ padding: 28 }}>
                  <h3 className="section-title">Review Your Complaint</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[['Title', form.title], ['Description', form.description], ['Category', form.category], ['Priority', form.priority], ['Address', form.address || 'Not specified'], ['Anonymous', form.isAnonymous ? 'Yes' : 'No'], ['Images', files.images.length + ' file(s)']].map(([k, v]) => (
                      <div key={k} className="flex justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-solid)', fontSize: 14 }}>
                        <span className="text-muted">{k}</span>
                        <span style={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between" style={{ marginTop: 20 }}>
                <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost" disabled={step === 0}>← Back</button>
                {step < 3
                  ? <button onClick={() => setStep(s => s + 1)} className="btn btn-primary">Next →</button>
                  : <button onClick={handleSubmit} disabled={loading} className="btn btn-primary btn-lg">
                      {loading ? <span className="spinner" /> : '🚀 Submit Complaint'}
                    </button>
                }
              </div>
            </div>

            {/* AI Chatbot sidebar */}
            <div>
              <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Complaint Assistant</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>Support for filing</div>
                  </div>
                </div>
                <div style={{ height: 280, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0', background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg3)', color: 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: '12px 12px 12px 0', width: 60, fontSize: 20 }}>...</div>}
                  {chatMessages.length === 1 && !chatLoading && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {CHAT_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => sendChat(opt)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 14, border: '1px solid var(--border-solid)', background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-solid)', display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ flex: 1, padding: '8px 12px' }} placeholder="Ask ResolvexBot..." value={chatInput}
                    onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                  <button onClick={sendChat} disabled={chatLoading} className="btn btn-primary btn-icon"><Send size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
