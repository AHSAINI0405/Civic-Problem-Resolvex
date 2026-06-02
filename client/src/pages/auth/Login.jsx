import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react';
import api from '../../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification email resent successfully! Please check your inbox. 📧');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail('');
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 🎉`);
      const redirects = { admin: '/admin/dashboard', department: '/dept/assigned', citizen: '/dashboard' };
      navigate(redirects[data.user.role] || '/dashboard');
    } catch (err) {
      const errCode = err.response?.data?.code;
      const errEmail = err.response?.data?.email;
      if (errCode === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(errEmail || form.email);
        toast.error('Email not verified. Please check your inbox or resend verification email.');
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440 }} className="fade-in-up">
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <img src="/Logo.png" alt="Resolvex Logo" style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 700 }}>Welcome to <span style={{ color: 'var(--primary)' }}>Resolvex</span></h1>
          <p className="text-muted" style={{ marginTop: 6, fontSize: 14 }}>AI-Powered Civic Complaint System</p>
        </div>

        <div className="glass" style={{ padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span />
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            {unverifiedEmail && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 13,
                lineHeight: 1.4
              }}>
                <p style={{ color: '#f87171', margin: 0, fontWeight: 500 }}>
                  Verification email sent to <strong>{unverifiedEmail}</strong> but has not been verified yet.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="btn"
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    alignSelf: 'flex-start',
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : <><Zap size={16} /> Sign In</>}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-sm text-muted">
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
