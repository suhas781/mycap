import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getStoredUser } from '../api';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        const path = user?.role === 'team_lead' ? '/team-lead' : user?.role === 'boe' ? '/boe' : user?.role === 'hr' ? '/hr' : user?.role === 'admin' ? '/admin' : user?.role === 'cluster_manager' ? '/cluster-manager' : user?.role === 'architect' ? '/campaign-analytics' : '/login';
        navigate(path, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  // Not logged in: show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 max-w-md w-full text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Sign in first to change your password.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-primary-500 text-black font-semibold py-2.5 px-4 text-sm hover:bg-primary-600"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 max-w-md w-full text-center">
          <p className="text-green-600 dark:text-green-400 font-medium">Password updated successfully.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 max-w-md w-full">
        <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
          Change password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Use your current password, then set a new one.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-xl border-2 border-slate-200 dark:border-dark-border py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-primary-500 text-black font-semibold py-2.5 text-sm hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
