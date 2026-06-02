import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuard';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Landing from './pages/Landing';
import VerifyEmail from './pages/auth/VerifyEmail';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import RaiseComplaint from './pages/citizen/RaiseComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetail from './pages/citizen/ComplaintDetail';
import Profile from './pages/citizen/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminComplaints from './pages/admin/Complaints';
import AdminUsers from './pages/admin/Users';
import AdminDepartments from './pages/admin/Departments';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSLA from './pages/admin/SLA';

// Department Pages
import DeptAssigned from './pages/department/Assigned';
import DeptComplaintDetail from './pages/department/ComplaintDetail';
import DeptPerformance from './pages/department/Performance';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' } }} />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

          {/* Citizen Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/raise-complaint" element={<ProtectedRoute allowedRoles={['citizen']}><RaiseComplaint /></ProtectedRoute>} />
          <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['citizen']}><MyComplaints /></ProtectedRoute>} />
          <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['admin']}><AdminComplaints /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><AdminDepartments /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/sla" element={<ProtectedRoute allowedRoles={['admin']}><AdminSLA /></ProtectedRoute>} />

          {/* Department Routes */}
          <Route path="/dept/assigned" element={<ProtectedRoute allowedRoles={['department']}><DeptAssigned /></ProtectedRoute>} />
          <Route path="/dept/complaints/:id" element={<ProtectedRoute allowedRoles={['department']}><DeptComplaintDetail /></ProtectedRoute>} />
          <Route path="/dept/performance" element={<ProtectedRoute allowedRoles={['department']}><DeptPerformance /></ProtectedRoute>} />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
