import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { generateGoalPacingMessage } from '../../services/ollamaService.js';
import { GOAL_PACE_DELTA } from '../../utils/calculations.js';

const PACE_LABEL = {
  lose_1kg: 'Lose 1 kg/week',
  lose_0_5kg: 'Lose 0.5 kg/week',
  maintain: 'Maintain weight',
  gain_0_5kg: 'Gain 0.5 kg/week',
  gain_1kg: 'Gain 1 kg/week',
};

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function GoalPacingCard({ profile, calorieTarget }) {
  const { user } = useAuth();
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || !profile?.goal_pace || profile.goal_pace === 'maintain') return;
    const weekStart = mondayOf();
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      supabase.from('food_log').select('date, calories').eq('user_id', user.id).gte('date', weekStart).lte('date', today),
      supabase.from('activity_log').select('date, calories_burned').eq('user_id', user.id).gte('date', weekStart).lte('date', today),
      supabase.from('ai_summaries').select('summary, created_at').eq('user_id', user.id).eq('week_start', weekStart).eq('kind', 'pacing').maybeSingle(),
    ]).then(([f, a, s]) => {
      const eatenByDate = {};
      (f.data || []).forEach((r) => { eatenByDate[r.date] = (eatenByDate[r.date] || 0) + (r.calories || 0); });
      const burnedByDate = {};
      (a.data || []).forEach((r) => { burnedByDate[r.date] = (burnedByDate[r.date] || 0) + (r.calories_burned || 0); });

      const daysElapsed = Object.keys(eatenByDate).length || 1;
      const dailyDelta = GOAL_PACE_DELTA[profile.goal_pace] ?? 0;
      const weeklyCalorieTarget = dailyDelta * 7;
      let currentDeficit = 0;
      Object.keys(eatenByDate).forEach((d) => {
        currentDeficit += (calorieTarget - eatenByDate[d]) + (burnedByDate[d] || 0);
      });
      const projectedWeeklyDeficit = Math.round((currentDeficit / daysElapsed) * 7);
      const daysRemaining = 7 - daysElapsed;
      setStats({
        pace: PACE_LABEL[profile.goal_pace],
        weeklyCalorieTarget,
        currentDeficit: Math.round(currentDeficit),
        projectedWeeklyDeficit,
        daysElapsed,
        daysRemaining,
      });
      if (s.data?.summary) setMessage(s.data.summary);
    });
  }, [user, profile?.goal_pace, calorieTarget]);

  const generate = async () => {
    if (!stats) return;
    setBusy(true);
    setError(null);
    try {
      const text = await generateGoalPacingMessage(
        { pace: stats.pace, weeklyCalorieTarget: stats.weeklyCalorieTarget },
        { currentDeficit: stats.currentDeficit, daysElapsed: stats.daysElapsed, projectedWeeklyDeficit: stats.projectedWeeklyDeficit, daysRemaining: stats.daysRemaining }
      );
      setMessage(text);
      if (user) {
        await supabase.from('ai_summaries').upsert(
          { user_id: user.id, week_start: mondayOf(), kind: 'pacing', summary: text },
          { onConflict: 'user_id,week_start,kind' }
        );
      }
    } catch (e) {
      setError('AI features unavailable — check your server connection');
    } finally {
      setBusy(false);
    }
  };

  if (!profile?.goal_pace || profile.goal_pace === 'maintain' || !stats) return null;

  const ratio = stats.projectedWeeklyDeficit / (stats.weeklyCalorieTarget || 1);
  const onTrack = Math.abs(ratio - 1) <= 0.15;
  const slightlyOff = !onTrack && Math.abs(ratio - 1) <= 0.4;
  const color = onTrack ? 'var(--brand)' : slightlyOff ? '#f59e0b' : 'var(--danger)';
  const label = onTrack ? 'On track' : slightlyOff ? 'Slightly off pace' : 'Off pace';

  return (
    <section className="card p-4" data-testid="goal-pacing">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">🎯 Goal pace</div>
        <span className="chip" style={{ backgroundColor: 'transparent', color, border: `1px solid ${color}` }}>{label}</span>
      </div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Projected weekly deficit: <span className="font-medium" style={{ color: 'var(--text)' }}>{stats.projectedWeeklyDeficit} kcal</span> · target: <span className="font-medium" style={{ color: 'var(--text)' }}>{stats.weeklyCalorieTarget} kcal</span>
      </div>
      {message ? (
        <p className="text-sm mt-2">{message}</p>
      ) : (
        <button onClick={generate} disabled={busy} className="btn-secondary text-sm mt-2">
          {busy ? 'Coaching…' : 'Get pacing tip'}
        </button>
      )}
      {error && <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</div>}
    </section>
  );
}
