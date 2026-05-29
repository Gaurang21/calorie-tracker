import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-bold mb-1">Reset password</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>We'll email you a reset link.</p>
        {sent ? (
          <div className="text-sm">Check your email for a reset link.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="hover:underline">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
