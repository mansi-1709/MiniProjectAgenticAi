import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏥</span>
            <h1 className="text-2xl font-bold text-primary-600">AI Pharmacy</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name} ({user.role === 'super_admin' ? '👑 Super Admin' : user.role === 'admin' ? '⚙️ Doctor' : '💊 Pharmacist'})
            </span>
            {(user.role === 'admin' || user.role === 'super_admin') && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
            )}
            {user.role === 'pharmacist' && (
              <Link
                to="/pharmacist"
                className="px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
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
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />

        {/* Routes */}
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

          {/* Protected routes */}
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

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm">
              Powered by <span className="font-semibold">OpenAI Agents</span> • Built with React, Node.js & MongoDB Atlas
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2026 AI Pharmacy Management System
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
