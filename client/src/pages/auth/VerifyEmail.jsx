import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError('Verification token missing.');
        setLoading(false);
        return;
      }

      try {
        await api.get(`/auth/verify-email/${encodeURIComponent(token)}`);
        toast.success('Email verified successfully. Please login.');
        // go to login after a short delay
        setTimeout(() => navigate('/login'), 800);
      } catch (err) {
        const msg = err.response?.data?.message || 'Verification failed.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass" style={{ padding: 32, maxWidth: 520, width: '100%' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Verify your email</h2>
        <p className="text-muted" style={{ marginBottom: 18 }}>
          {loading ? 'Verifying your account...' : error ? 'Unable to verify your email.' : 'Verification complete.'}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: 14 }}>
            <p style={{ margin: 0, color: '#f87171', fontWeight: 600, fontSize: 14 }}>{error}</p>
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
