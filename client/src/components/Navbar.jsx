import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Bell, LogOut, User, Menu, X, ChevronDown, Home, FileText, PlusCircle, BarChart2, Users, Building2, Shield, ClipboardList } from 'lucide-react';

const NAV_LINKS = {
  citizen: [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/raise-complaint', icon: PlusCircle, label: 'Raise Complaint' },
    { to: '/my-complaints', icon: FileText, label: 'My Complaints' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
    { to: '/admin/complaints', icon: ClipboardList, label: 'Complaints' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/admin/sla', icon: Shield, label: 'SLA' },
  ],
  department: [
    { to: '/dept/assigned', icon: ClipboardList, label: 'Assigned' },
    { to: '/dept/performance', icon: BarChart2, label: 'Performance' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const links = NAV_LINKS[user?.role] || [];

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications);
        setUnread(res.data.unreadCount);
      } catch {}
    };
    if (user) fetchNotifs();
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <nav style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)', position: 'sticky', top: 0, zIndex: 1000, padding: '0 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img src="/Logo.png" alt="Resolvex Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>Resolv<span style={{ color: '#6366f1' }}>ex</span></span>
        </Link>

        {/* Nav links desktop */}
        <div className="flex gap-2" style={{ flex: 1, display: 'flex' }}>
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: location.pathname.startsWith(to) ? '#6366f1' : '#94a3b8',
                background: location.pathname.startsWith(to) ? 'rgba(99,102,241,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
              <Bell size={18} />
              {unread > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'block' }} />
              )}
            </button>
            {notifOpen && (
              <div className="glass" style={{ position: 'absolute', right: 0, top: 48, width: 340, maxHeight: 420, overflowY: 'auto', zIndex: 200 }}>
                <div className="flex justify-between items-center" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-solid)' }}>
                  <span className="font-semibold" style={{ fontSize: 14 }}>Notifications {unread > 0 && <span style={{ color: '#6366f1' }}>({unread})</span>}</span>
                  {unread > 0 && <button onClick={markAllRead} className="btn-ghost btn btn-sm">Mark all read</button>}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-solid)', background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)', cursor: 'pointer' }}
                    onClick={() => { n.complaint && navigate(`/complaints/${n.complaint._id || n.complaint}`); setNotifOpen(false); }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2" style={{ background: 'var(--bg3)', border: '1px solid var(--border-solid)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>
            {profileOpen && (
              <div className="glass" style={{ position: 'absolute', right: 0, top: 46, width: 200, zIndex: 200 }}>
                <Link to="/profile" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--text)', textDecoration: 'none', fontSize: 14 }}>
                  <User size={15} /> Profile
                </Link>
                <div style={{ height: 1, background: 'var(--border-solid)' }} />
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#ef4444', fontSize: 14, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
