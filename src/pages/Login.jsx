import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 athletic-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-md grid place-items-center text-white mb-5"
            style={{ backgroundColor: 'var(--brand)', boxShadow: '0 10px 28px var(--brand-glow)' }}>
            <Zap size={26} strokeWidth={2.5} fill="currentColor" />
          </div>
          <h1 className="display text-[40px] uplabel leading-none" style={{ letterSpacing: '0.06em' }}>
            TRACK. EAT. <span style={{ color: 'var(--brand)' }}>WIN.</span>
          </h1>
          <p className="text-[12px] mt-3 uplabel font-bold" style={{ color: 'var(--text-muted)', letterSpacing: '0.10em' }}>
            PRECISION NUTRITION
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="label" htmlFor="email">EMAIL</label>
              <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="password">PASSWORD</label>
              <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div data-testid="auth-error" className="text-[12px] font-bold uppercase" style={{ color: 'var(--danger)', letterSpacing: '0.05em' }}>{error}</div>}
            <button disabled={busy} className="btn-primary w-full">{busy ? 'SIGNING IN…' : 'SIGN IN'}</button>
          </form>
          <button onClick={signInWithGoogle} className="btn-secondary w-full mt-2.5">CONTINUE WITH GOOGLE</button>
        </div>

        <div className="mt-5 text-[11px] flex items-center justify-between px-1 uppercase font-bold" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          <Link to="/reset" className="hover:underline">FORGOT PASSWORD?</Link>
          <Link to="/signup" className="hover:underline" style={{ color: 'var(--brand)' }}>CREATE ACCOUNT →</Link>
        </div>
      </div>
    </div>
  );
}
