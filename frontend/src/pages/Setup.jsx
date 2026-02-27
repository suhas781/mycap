import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function getSetupStatus() {
  const res = await fetch(`${API_BASE}/auth/setup-status`);
  const data = await res.json().catch(() => ({}));
  return data.allowed === true;
}

export default function Setup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getSetupStatus()
      .then(setAllowed)
      .catch(() => setAllowed(false))
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-slate-500 dark:text-slate-400">Checking…</div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 max-w-md w-full text-center">
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
            Setup already completed
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The first HR account already exists. Sign in to continue.
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

  if (done) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 max-w-md w-full text-center">
          <p className="text-green-600 dark:text-green-400 font-medium">First HR account created.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-8 max-w-md w-full">
        <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
          Create first HR account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Use your <strong>@mycaptain.in</strong> email. You will be the first HR and can sign in after this.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="setup-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your name
            </label>
            <input
              id="setup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="setup-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email (@mycaptain.in only)
            </label>
            <input
              id="setup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mycaptain.in"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="setup-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password (min 6 characters)
            </label>
            <input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="setup-confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Confirm password
            </label>
            <input
              id="setup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark px-4 py-2.5 text-slate-900 dark:text-white"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-500 text-black font-semibold py-2.5 text-sm hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create HR account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
