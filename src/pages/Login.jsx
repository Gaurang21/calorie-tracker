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
    try {
      await signIn(email, password);
      const to = location.state?.from || '/';
      nav(to);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 auth-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-3xl grid place-items-center text-white font-semibold text-xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #5fd589, #30D158)',
              boxShadow: '0 10px 30px var(--brand-glow)',
            }}
          >
            C
          </div>
          <h1 className="text-[26px] font-bold tracking-tight2">Welcome back</h1>
          <p className="text-[14px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Sign in to continue your progress.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div data-testid="auth-error" className="text-[13px]" style={{ color: 'var(--danger)' }}>{error}</div>}
            <button disabled={busy} className="btn-primary w-full mt-1">{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <button onClick={signInWithGoogle} className="btn-secondary w-full mt-3">Continue with Google</button>
        </div>

        <div className="mt-5 text-[13px] flex items-center justify-between px-1" style={{ color: 'var(--text-muted)' }}>
          <Link to="/reset" className="hover:underline">Forgot password?</Link>
          <Link to="/signup" className="hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
