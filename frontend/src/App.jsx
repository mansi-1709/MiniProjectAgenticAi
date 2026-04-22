import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ToastProvider } from './context/ToastContext';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Allow both admin and super_admin to access admin dashboard
    if (requiredRole === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) {
      return children;
    }
    return <Navigate to={user.role === 'admin' || user.role === 'super_admin' ? '/admin' : '/pharmacist'} replace />;
  }

  return children;
}

// Navigation Component
function Navigation() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (!user) {
    return null; // Don't show navigation on login/register pages
  }

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm">PB</div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 leading-tight">PharmaBooks</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Cloud Pharmacy Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user.name} ({user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Doctor' : 'Pharmacist'})
            </span>
            {(user.role === 'admin' || user.role === 'super_admin') && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-lg font-medium bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>
            )}
            {user.role === 'pharmacist' && (
              <Link
                to="/pharmacist"
                className="px-4 py-2 rounded-lg font-medium bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  function AppContent() {
    const location = useLocation();
    const hideFooter = location.pathname === '/pharmacist' || location.pathname === '/admin';

    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Navigation />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

          <Route 
            path="/pharmacist" 
            element={
              <ProtectedRoute requiredRole="pharmacist">
                <PharmacistDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>

        {!hideFooter && (
          <footer className="bg-primary-900 text-white py-8 mt-12">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-sm text-primary-100">
                PharmaBooks • Smart Billing, Inventory and Pharmacy Operations
              </p>
              <p className="text-xs text-primary-200 mt-2">
                © 2026 PharmaBooks Platform
              </p>
            </div>
          </footer>
        )}
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;
