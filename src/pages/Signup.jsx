import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await signUp(email, password);
      nav('/onboarding');
    } catch (err) {
      setError(err.message || 'Sign up failed');
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
          <h1 className="text-[26px] font-bold tracking-tight2">Track every day</h1>
          <p className="text-[14px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
            Calories, macros, water, and activity — clean and simple.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" required autoComplete="new-password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <div data-testid="auth-error" className="text-[13px]" style={{ color: 'var(--danger)' }}>{error}</div>}
            <button disabled={busy} className="btn-primary w-full mt-1">{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
          <button onClick={signInWithGoogle} className="btn-secondary w-full mt-3">Continue with Google</button>
        </div>

        <div className="mt-5 text-[13px] text-center" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--brand)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
