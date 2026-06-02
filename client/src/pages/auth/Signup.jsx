import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Zap } from 'lucide-react';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Check your email to verify. 📧');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ position: 'fixed', top: '30%', right: '25%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 460 }} className="fade-in-up">
        <div className="text-center" style={{ marginBottom: 36 }}>
          <img src="/Logo.png" alt="Resolvex Logo" style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 700 }}>Join <span style={{ color: 'var(--primary)' }}>Resolvex</span></h1>
          <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>Report civic issues and make your city better</p>
        </div>

        <div className="glass" style={{ padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                <input type="text" className="form-input" style={{ paddingLeft: 38 }} placeholder="John Doe"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: 38 }} placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                <input type={showPw ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }}
                  placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                <input type="password" className="form-input" style={{ paddingLeft: 38 }}
                  placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? <span className="spinner" /> : <><Zap size={16} /> Create Account</>}
            </button>
          </form>
          <div className="divider" />
          <p className="text-center text-sm text-muted">
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
