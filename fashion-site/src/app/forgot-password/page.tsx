'use client';

import { useState } from 'react';
import { passwordResetApi } from '@/lib/api-client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await passwordResetApi.forgot(email) as { token?: string };
      setSent(true);
      if (res.token) setDevToken(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-2xl font-bold gradient-text">FashionStore</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to reset your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-4">
                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
              </p>
              {devToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Dev Mode - Reset Token:</p>
                  <Link href={`/reset-password?token=${devToken}`} className="text-xs text-amber-700 break-all underline">
                    /reset-password?token={devToken}
                  </Link>
                </div>
              )}
              <Link href="/login" className="text-indigo-600 font-medium text-sm hover:underline">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
