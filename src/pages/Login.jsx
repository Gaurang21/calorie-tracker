import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try { await signIn(email, password); nav(location.state?.from || '/'); }
    catch (err) { setError(err.message || 'Login failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 border-r" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded grid place-items-center text-white font-medium text-[11px]" style={{ backgroundColor: 'var(--brand)' }}>C</div>
          <div className="text-[13px] font-medium">Calorie Tracker</div>
        </div>
        <div>
          <div className="eyebrow mb-3">A power tool for tracking</div>
          <h1 className="text-[28px] font-medium tracking-tight leading-tight">
            Every calorie. Every macro.<br />
            <span style={{ color: 'var(--text-muted)' }}>Logged in seconds.</span>
          </h1>
          <p className="text-[13px] mt-4 max-w-md" style={{ color: 'var(--text-muted)' }}>
            Designed for people who want their daily nutrition data to be as fast and frictionless as their dev tools.
          </p>
        </div>
        <div className="text-[11px] mono" style={{ color: 'var(--text-muted)' }}>v1.0 · open source</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <div className="eyebrow mb-2">Sign in</div>
            <h2 className="text-[20px] font-medium tracking-tight">Welcome back</h2>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" className="input mono" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" className="input mono" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div data-testid="auth-error" className="text-[12px] mono" style={{ color: 'var(--danger)' }}>{error}</div>}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? 'Signing in…' : 'Sign in'}
              <span className="mono text-[10px] opacity-70 ml-1 px-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>⌘↵</span>
            </button>
          </form>
          <button onClick={signInWithGoogle} className="btn-secondary w-full mt-2">Continue with Google</button>
          <div className="mt-4 text-[12px] flex items-center justify-between mono" style={{ color: 'var(--text-muted)' }}>
            <Link to="/reset" className="hover:underline">Forgot password?</Link>
            <Link to="/signup" className="hover:underline">Create account →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
