import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setStoredUser } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setStoredUser(data.user);
      const role = data.user.role;
      const path = role === 'team_lead' ? '/team-lead' : role === 'boe' ? '/boe' : role === 'hr' ? '/hr' : role === 'admin' ? '/admin' : role === 'cluster_manager' ? '/cluster-manager' : role === 'architect' ? '/campaign-analytics' : '/login';
      navigate(path, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-[#0a0a0a] dark:via-[#0E0E0E] dark:to-[#1a0f00]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 dark:opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-400/10 dark:bg-primary-600/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[420px] mx-4 animate-slide-up">
        <div className="rounded-3xl border border-slate-200/80 dark:border-dark-border bg-white/90 dark:bg-dark-card/95 backdrop-blur-xl shadow-card dark:shadow-card-dark shadow-slate-200/50 dark:shadow-none p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-500 text-black font-bold text-xl mb-4 shadow-glow-sm">
              MC
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 dark:text-white tracking-tight">
              Lead Management
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in to manage leads and teams
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                <span className="shrink-0 size-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">!</span>
                {error}
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark bg-slate-50/50 dark:bg-dark/50 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:ring-0"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-dark bg-slate-50/50 dark:bg-dark/50 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:ring-0"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-500 text-black font-semibold py-3.5 px-4 text-sm shadow-glow-sm hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
