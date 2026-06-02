import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Save, Lock, Bell } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', address: '', avatar: '', notificationPrefs: { email: true, inApp: true } });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', avatar: user.avatar || '', notificationPrefs: user.notificationPrefs || { email: true, inApp: true } });
  }, [user]);

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated successfully! ✅');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match.');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully! 🔐');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
    finally { setPwLoading(false); }
  };

  const TABS = [{ id: 'profile', label: 'Profile', icon: User }, { id: 'security', label: 'Security', icon: Lock }, { id: 'notifications', label: 'Notifications', icon: Bell }];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Profile header */}
          <div className="glass" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 700, margin: 0 }}>{user?.name}</h1>
                {user?.isVerified ? (
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: 11, padding: '2px 8px' }}>Verified</span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: 11, padding: '2px 8px' }}>Unverified</span>
                )}
              </div>
              <p className="text-muted text-sm" style={{ margin: '4px 0' }}>{user?.email}</p>
              
              <div className="flex gap-2" style={{ marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{user?.role}</span>
                {user?.department && (
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>{user.department.name || user.department}</span>
                )}
                {user?.lastLogin && (
                  <span className="text-sm text-muted" style={{ fontSize: 12 }}>
                    Last Login: {new Date(user.lastLogin).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-2" style={{ marginBottom: 24 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="glass" style={{ padding: 28 }}>
              <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Avatar URL</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="https://example.com/avatar.jpg" value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} value={user?.email} disabled />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="+91 ..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Your city/address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'fit-content' }}>
                  {loading ? <span className="spinner" /> : <><Save size={15} /> Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {/* Security tab */}
          {tab === 'security' && (
            <div className="glass" style={{ padding: 28 }}>
              <h3 className="section-title">Change Password</h3>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']].map(([field, label]) => (
                  <div key={field} className="form-group">
                    <label className="form-label">{label}</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                      <input type="password" className="form-input" style={{ paddingLeft: 36 }} value={pwForm[field]} onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))} required />
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={pwLoading} className="btn btn-primary" style={{ width: 'fit-content' }}>
                  {pwLoading ? <span className="spinner" /> : <><Lock size={15} /> Update Password</>}
                </button>
              </form>
            </div>
          )}

          {/* Notifications tab */}
          {tab === 'notifications' && (
            <div className="glass" style={{ padding: 28 }}>
              <h3 className="section-title">Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['email', 'Email Notifications', 'Get status updates via email'], ['inApp', 'In-App Notifications', 'Real-time alerts in the app']].map(([key, title, desc]) => (
                  <div key={key} className="flex justify-between items-center" style={{ padding: '14px 18px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border-solid)' }}>
                    <div><p style={{ fontWeight: 500, fontSize: 14 }}>{title}</p><p className="text-muted text-sm">{desc}</p></div>
                    <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={form.notificationPrefs?.[key] || false}
                        onChange={e => setForm(f => ({ ...f, notificationPrefs: { ...f.notificationPrefs, [key]: e.target.checked } }))} />
                      <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: form.notificationPrefs?.[key] ? 'var(--primary)' : 'var(--bg4)', transition: 'all 0.2s' }}>
                        <span style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: form.notificationPrefs?.[key] ? 23 : 3, transition: 'all 0.2s' }} />
                      </span>
                    </label>
                  </div>
                ))}
                <button onClick={handleProfile} disabled={loading} className="btn btn-primary" style={{ width: 'fit-content' }}>
                  {loading ? <span className="spinner" /> : <><Save size={15} /> Save Preferences</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
