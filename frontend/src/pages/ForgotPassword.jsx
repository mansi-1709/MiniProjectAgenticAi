import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      setSuccess(true);
      setResetInfo(res.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Check your email</h2>
            <p className="text-gray-600 mb-6">
              Password reset instructions have been sent to <strong>{email}</strong>
            </p>
            
            {resetInfo?.resetToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs text-yellow-800 font-semibold mb-2">
                  Development mode (email not configured)
                </p>
                <p className="text-xs text-gray-600 mb-2">Reset URL:</p>
                <code className="text-xs bg-white p-2 rounded block break-all">
                  {resetInfo.resetUrl}
                </code>
              </div>
            )}
            
            <Link 
              to="/login" 
              className="inline-block bg-primary-700 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-primary-800 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="text-center mb-8">
          <h1 className="section-title mb-2">Forgot password</h1>
          <p className="muted-text">Enter your email to reset your password</p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 text-white py-2.5 rounded-md font-semibold hover:bg-primary-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary-700 hover:text-primary-800 font-semibold text-sm">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
