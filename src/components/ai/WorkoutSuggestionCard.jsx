import { useEffect, useState } from 'react';
import { Activity, Heart, X } from 'lucide-react';
import { generateWorkoutSuggestion } from '../../services/aiService.js';

export default function WorkoutSuggestionCard({ kind = 'recovery', activityLog, calorieData }) {
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
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

  const Icon = kind === 'recovery' ? Heart : Activity;
  const tone = kind === 'recovery' ? 'var(--ruby)' : 'var(--brand)';

  return (
    <section className="card p-5" data-testid="workout-suggestion">
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-2xl grid place-items-center shrink-0"
          style={{ backgroundColor: `${tone}1A`, color: tone }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow mb-1">
            {kind === 'recovery' ? 'Recovery Tip' : 'Movement Nudge'}
          </div>
          {busy && <div className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Thinking…</div>}
          {message && <div className="text-[14px] leading-relaxed">{message}</div>}
          {error && <div className="text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>
        <button aria-label="Dismiss" onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100 transition shrink-0">
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
