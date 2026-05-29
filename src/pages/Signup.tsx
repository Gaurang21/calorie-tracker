import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center p-4 warm-bg">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold mb-1">Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track calories, macros, water, and activity.</p>
        </div>
        <Card className="p-7" style={{ borderRadius: '32px' }}>
          <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <div data-testid="auth-error" className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
            <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating account…' : 'Create account'}</Button>
          </form>
          <Button variant="secondary" onClick={signInWithGoogle} className="w-full mt-3">Continue with Google</Button>
        </Card>
        <div className="mt-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--brand)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
