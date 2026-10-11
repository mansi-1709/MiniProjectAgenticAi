import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

// Demo user credentials
const DEMO_USERS = {
  doctor: {
    email: 'demo.doctor@pharmacy.com',
    password: 'DemoDoctor@123',
    label: 'Doctor / Admin',
    icon: '🩺',
    description: 'Full admin panel access',
    gradient: 'from-violet-600 to-indigo-600',
    hoverGradient: 'hover:from-violet-700 hover:to-indigo-700',
    ring: 'focus:ring-violet-300',
    badge: 'bg-violet-100 text-violet-700',
  },
  pharmacist: {
    email: 'demo.pharma@pharmacy.com',
    password: 'DemoPharma@123',
    label: 'Pharmacist',
    icon: '💊',
    description: 'Order & inventory access',
    gradient: 'from-emerald-500 to-teal-600',
    hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
    ring: 'focus:ring-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'doctor' | 'pharmacist' | null
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login(formData);
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));

      if (res.data.data.user.role === 'admin' || res.data.data.user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/pharmacist');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ── Demo login handler ────────────────────────────────────────────────────
  const handleDemoLogin = async (role) => {
    const demo = DEMO_USERS[role];
    setError('');
    setDemoLoading(role);

    // Visually fill the form so the recruiter sees the credentials
    setFormData({ email: demo.email, password: demo.password });

    // Brief pause so recruiter sees the auto-fill, then log in
    await new Promise((r) => setTimeout(r, 700));

    try {
      const res = await authAPI.login({ email: demo.email, password: demo.password });
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));

      if (res.data.data.user.role === 'admin' || res.data.data.user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/pharmacist');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Demo login failed. Please run "npm run seed-demo" in the backend first.',
      );
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md">

        {/* ── Demo Access Card ─────────────────────────────────────────── */}
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">🚀</span>
            <p className="text-sm font-semibold text-slate-700">Try a Live Demo</p>
            <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
              Recruiter Access
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEMO_USERS).map(([role, demo]) => (
              <button
                key={role}
                id={`demo-login-${role}`}
                onClick={() => handleDemoLogin(role)}
                disabled={demoLoading !== null || loading}
                className={`
                  relative flex flex-col items-start rounded-xl bg-gradient-to-br ${demo.gradient}
                  ${demo.hoverGradient} px-4 py-3.5 text-left text-white shadow-md
                  transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                  active:translate-y-0 active:scale-[0.98]
                  disabled:cursor-not-allowed disabled:opacity-60
                  focus:outline-none focus:ring-2 ${demo.ring} focus:ring-offset-1
                `}
              >
                {demoLoading === role && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </span>
                )}
                <span className="mb-1 text-xl leading-none">{demo.icon}</span>
                <span className="text-sm font-bold leading-tight">{demo.label}</span>
                <span className="mt-0.5 text-xs font-normal text-white/80">{demo.description}</span>
              </button>
            ))}
          </div>

          {/* Credential hint */}
          <p className="mt-3 text-center text-xs text-slate-400">
            Credentials auto-fill on click — no setup needed
          </p>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="relative mb-4 flex items-center">
          <div className="flex-1 border-t border-slate-200" />
          <span className="mx-3 text-xs font-medium text-slate-400">or sign in manually</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* ── Login Card ────────────────────────────────────────────────── */}
        <div className="auth-card">
          <div className="text-center mb-8">
            <h1 className="section-title mb-2">Sign in</h1>
            <p className="muted-text">Pharmacy Management System</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="input-field"
                placeholder="superadmin@pharmacy.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-primary-700 hover:text-primary-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading !== null}
              className="w-full bg-primary-700 text-white py-2.5 rounded-md font-semibold hover:bg-primary-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-700 hover:text-primary-800 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
