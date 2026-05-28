import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 auth-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-[26px] font-bold tracking-tight2">Reset password</h1>
          <p className="text-[14px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            We'll email you a reset link.
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-[14px] text-center py-2">
              Check your email for a reset link.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <div className="text-[13px]" style={{ color: 'var(--danger)' }}>{error}</div>}
              <button disabled={busy} className="btn-primary w-full mt-1">{busy ? 'Sending…' : 'Send reset link'}</button>
            </form>
          )}
        </div>

        <div className="mt-5 text-[13px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
