import { useEffect, useState } from 'react';
import { generateDailyInsight } from '../../services/aiService';
import { todayLocalISO } from '../../utils/date';
import type { TodayData, RecentHistory } from '../../types/ai';

interface Props {
  todayData: TodayData;
  recentHistory: RecentHistory;
}

const todayKey = todayLocalISO;
const DISMISS_KEY = `daily-insight-dismissed-${todayKey()}`;
const CACHE_KEY = `daily-insight-${todayKey()}`;

function pickTrigger({ todayData }: { todayData: TodayData }): string {
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours();
  if ((dow === 5 || dow === 6)) return 'weekend over-eating risk';
  if (hour >= 18 && todayData.proteinEaten < todayData.proteinGoal * 0.6) return 'protein under 60% by 6pm';
  if (hour >= 19 && todayData.caloriesEaten === 0) return 'streak nudge — not logged yet';
  return 'positive reinforcement';
}

export default function DailyInsightCard({ todayData, recentHistory }: Props) {
  const [insight, setInsight] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dismissed) return;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setInsight(cached);
      return;
    }
    setBusy(true);
    const trigger = pickTrigger({ todayData });
    generateDailyInsight(todayData, { ...recentHistory, trigger })
      .then((text) => {
        setInsight(text);
        localStorage.setItem(CACHE_KEY, text);
      })
      .catch(() => setError('AI features unavailable — check your server connection'))
      .finally(() => setBusy(false));
  }, [dismissed]); // eslint-disable-line

  if (dismissed || (!insight && !busy && !error)) return null;

  return (
    <section className="card p-4" data-testid="daily-insight">
      <div className="flex items-start gap-3">
        <div className="text-xl">💡</div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Today's insight</div>
          {busy && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Thinking…</div>}
          {insight && <div className="text-sm">{insight}</div>}
          {error && <div className="text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>
        <button
          aria-label="Dismiss insight"
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true); }}
          className="opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </section>
  );
}
