import { useEffect, useState } from 'react';
import { generateWorkoutSuggestion } from '../../services/aiService';
import type { ActivityLogContext, CalorieDataContext } from '../../types/ai';

type Kind = 'recovery' | 'movement';

interface Props {
  kind?: Kind;
  activityLog: ActivityLogContext;
  calorieData: CalorieDataContext;
}

export default function WorkoutSuggestionCard({ kind = 'recovery', activityLog, calorieData }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!activityLog || !calorieData) return;
    setBusy(true);
    generateWorkoutSuggestion(activityLog, calorieData)
      .then((text) => setMessage(text))
      .catch(() => setError('AI features unavailable — check your server connection'))
      .finally(() => setBusy(false));
  }, [activityLog?.lastSession, activityLog?.daysSinceLast]); // eslint-disable-line

  if (dismissed || (!message && !busy && !error)) return null;

  return (
    <section className="card p-4" data-testid="workout-suggestion">
      <div className="flex items-start gap-3">
        <div className="text-xl">{kind === 'recovery' ? '🧊' : '🚶'}</div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            {kind === 'recovery' ? 'Recovery tip' : 'Movement nudge'}
          </div>
          {busy && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Thinking…</div>}
          {message && <div className="text-sm">{message}</div>}
          {error && <div className="text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>
        <button aria-label="Dismiss" onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100">✕</button>
      </div>
    </section>
  );
}
