import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetToken } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, message: '', color: '' };

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/[0-9]/.test(password)) score++; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score++; // special chars

    // Determine strength
    if (score <= 2) return { score, message: 'Weak', color: 'text-red-600' };
    if (score <= 4) return { score, message: 'Medium', color: 'text-yellow-600' };
    return { score, message: 'Strong', color: 'text-green-600' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(resetToken, formData.password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time password strength check
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now login with your new password.
          </p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-sm">
            <p className="font-semibold mb-1">⚠️ Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="e.g., MyPass@123"
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
            
            {/* Show validation warnings only when user has typed */}
            {formData.password && (
              <>
                {formData.password.length < 8 && (
                  <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-xs text-amber-800">⚠️ Password must be at least 8 characters</p>
                  </div>
                )}
                {formData.password.length >= 8 && !/[a-z]/.test(formData.password) && (
                  <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-xs text-amber-800">⚠️ Add at least one lowercase letter (a-z)</p>
                  </div>
                )}
                {formData.password.length >= 8 && !/[A-Z]/.test(formData.password) && (
                  <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-xs text-amber-800">⚠️ Add at least one uppercase letter (A-Z)</p>
                  </div>
                )}
                {formData.password.length >= 8 && !/[0-9]/.test(formData.password) && (
                  <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-xs text-amber-800">⚠️ Add at least one number (0-9)</p>
                  </div>
                )}
                {formData.password.length >= 8 && !/[^a-zA-Z0-9]/.test(formData.password) && (
                  <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-xs text-amber-800">⚠️ Add at least one special character (!@#$%^&*)</p>
                  </div>
                )}
                {passwordStrength.score >= 5 && (
                  <div className="mt-2 p-2 bg-emerald-50 border-l-4 border-emerald-400 rounded">
                    <p className="text-xs text-emerald-800">✓ Strong password!</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirmPassword ? (
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
            
            {/* Show mismatch warning */}
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-xs text-red-800">⚠️ Passwords do not match</p>
              </div>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="mt-2 p-2 bg-emerald-50 border-l-4 border-emerald-400 rounded">
                <p className="text-xs text-emerald-800">✓ Passwords match</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
