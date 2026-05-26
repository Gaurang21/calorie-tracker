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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-brand-500 grid place-items-center text-white font-bold">C</div>
          <h1 className="text-xl font-bold">Welcome back</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div data-testid="auth-error" className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <button onClick={signInWithGoogle} className="btn-secondary w-full mt-3">Continue with Google</button>
        <div className="mt-4 text-sm flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
          <Link to="/reset" className="hover:underline">Forgot password?</Link>
          <Link to="/signup" className="hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
