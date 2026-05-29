import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setBusy(true);
    try {
      await signUp(email, password);
      nav('/onboarding');
    } catch (err) {
      setError((err as Error).message || 'Sign up failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-bold mb-1">Create your account</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Track calories, macros, water, and activity.</p>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
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
          {error && <div data-testid="auth-error" className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <button onClick={signInWithGoogle} className="btn-secondary w-full mt-3">Continue with Google</button>
        <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
