import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { generateDailyInsight } from '../../services/aiService.js';

const todayKey = () => new Date().toISOString().slice(0, 10);
const DISMISS_KEY = `daily-insight-dismissed-${todayKey()}`;
const CACHE_KEY = `daily-insight-${todayKey()}`;

function pickTrigger({ todayData }) {
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours();
  if ((dow === 5 || dow === 6)) return 'weekend over-eating risk';
  if (hour >= 18 && todayData.proteinEaten < todayData.proteinGoal * 0.6) return 'protein under 60% by 6pm';
  if (hour >= 19 && todayData.caloriesEaten === 0) return 'streak nudge — not logged yet';
  return 'positive reinforcement';
}

export default function DailyInsightCard({ todayData, recentHistory }) {
  const [insight, setInsight] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
    <section className="card p-5" data-testid="daily-insight">
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-2xl grid place-items-center shrink-0"
          style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand)' }}
        >
          <Lightbulb size={18} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow mb-1">Today's Insight</div>
          {busy && <div className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Thinking…</div>}
          {insight && <div className="text-[14px] leading-relaxed">{insight}</div>}
          {error && <div className="text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>
        <button
          aria-label="Dismiss insight"
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true); }}
          className="opacity-50 hover:opacity-100 transition shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
