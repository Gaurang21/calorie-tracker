import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center p-4 warm-bg">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold mb-1">Reset password</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>We'll email you a reset link.</p>
        </div>
        <Card className="p-7" style={{ borderRadius: '32px' }}>
          {sent ? (
            <div className="text-sm text-center py-2">Check your email for a reset link.</div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
              <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending…' : 'Send reset link'}</Button>
            </form>
          )}
        </Card>
        <div className="mt-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
