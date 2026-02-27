import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { validateSignupFields } from '../utils/AuthValidation';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const { valid, errors: fieldErrors } = validateSignupFields({
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    setErrors(fieldErrors);
    if (!valid) return;

    setLoading(true);
    try {
      await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
        }),
      });
      navigate('/login', { replace: true, state: { message: 'Account created. Sign in to continue.' } });
    } catch (err) {
      setServerError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FF7A00]/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[420px] mx-4">
        <div className="rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF7A00] text-black font-bold text-xl mb-4">
              MC
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight">
              Create account
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Use your @mycaptain.in email to sign up
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {serverError && (
              <div
                className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-800/50 px-4 py-3 text-sm text-red-300"
                role="alert"
              >
                <span className="shrink-0 size-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">!</span>
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-white/80 mb-1.5">
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
                placeholder="Your name"
                className={`w-full rounded-xl border-2 bg-[#0E0E0E] text-white placeholder-white/40 px-4 py-3 text-sm transition-colors focus:ring-0 ${
                  errors.name ? 'border-red-600 focus:border-red-500' : 'border-[#2A2A2A] focus:border-[#FF7A00]'
                }`}
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-1.5">
                Email (@mycaptain.in)
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                placeholder="you@mycaptain.in"
                className={`w-full rounded-xl border-2 bg-[#0E0E0E] text-white placeholder-white/40 px-4 py-3 text-sm transition-colors focus:ring-0 ${
                  errors.email ? 'border-red-600 focus:border-red-500' : 'border-[#2A2A2A] focus:border-[#FF7A00]'
                }`}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-1.5">
                Password (min 6 characters)
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '', confirm_password: '' })); }}
                placeholder="••••••••"
                className={`w-full rounded-xl border-2 bg-[#0E0E0E] text-white placeholder-white/40 px-4 py-3 text-sm transition-colors focus:ring-0 ${
                  errors.password ? 'border-red-600 focus:border-red-500' : 'border-[#2A2A2A] focus:border-[#FF7A00]'
                }`}
                autoComplete="new-password"
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-medium text-white/80 mb-1.5">
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirm_password: '' })); }}
                placeholder="••••••••"
                className={`w-full rounded-xl border-2 bg-[#0E0E0E] text-white placeholder-white/40 px-4 py-3 text-sm transition-colors focus:ring-0 ${
                  errors.confirm_password ? 'border-red-600 focus:border-red-500' : 'border-[#2A2A2A] focus:border-[#FF7A00]'
                }`}
                autoComplete="new-password"
              />
              {errors.confirm_password && <p className="mt-1 text-xs text-red-400">{errors.confirm_password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#FF7A00] text-black font-semibold py-3.5 px-4 text-sm hover:bg-[#e66d00] active:bg-[#cc6100] disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                'Sign up'
              )}
            </button>

            <p className="text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FF7A00] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
