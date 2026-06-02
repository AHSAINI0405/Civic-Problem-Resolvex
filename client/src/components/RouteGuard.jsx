import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirect to login if not authenticated
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-loader">
      <img src="/Loading.gif" alt="Loading..." style={{ width: '80px', height: '80px' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirects = { admin: '/admin/dashboard', department: '/dept/assigned', citizen: '/dashboard' };
    return <Navigate to={redirects[user.role] || '/dashboard'} replace />;
  }
  return children;
};

// Redirect to dashboard if already logged in
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-loader">
      <img src="/Loading.gif" alt="Loading..." style={{ width: '80px', height: '80px' }} />
    </div>
  );
  if (user) {
    const redirects = { admin: '/admin/dashboard', department: '/dept/assigned', citizen: '/dashboard' };
    return <Navigate to={redirects[user.role] || '/dashboard'} replace />;
  }
  return children;
};
