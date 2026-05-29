import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface LocationState { from?: string }

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try { await signIn(email, password); nav((location.state as LocationState | null)?.from || '/'); }
    catch (err) { setError((err as Error).message || 'Login failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 warm-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-3xl grid place-items-center text-white mb-5"
            style={{ background: 'linear-gradient(135deg, #FF8A65, #A8C5A0)', boxShadow: '0 12px 32px var(--brand-glow)' }}
          >
            <Sun size={26} strokeWidth={2.2} />
          </div>
          <h1 className="text-[26px] font-bold tracking-widest uppercase">TRACK. EAT. WIN.</h1>
          <p className="text-[14px] mt-2 italic" style={{ color: 'var(--text-muted)' }}>
            ready when you are.
          </p>
        </div>

        <Card className="p-7" style={{ borderRadius: '32px' }}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div data-testid="auth-error" className="text-[13px]" style={{ color: 'var(--danger)' }}>{error}</div>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing you in…' : 'Sign in 🌿'}
            </Button>
          </form>
          <Button variant="secondary" onClick={signInWithGoogle} className="w-full mt-3">Continue with Google</Button>
        </Card>

        <div className="mt-6 text-[13px] flex items-center justify-between px-2" style={{ color: 'var(--text-muted)' }}>
          <Link to="/reset" className="hover:underline">Forgot password?</Link>
          <Link to="/signup" className="hover:underline">Create account →</Link>
        </div>
      </div>
    </div>
  );
}
