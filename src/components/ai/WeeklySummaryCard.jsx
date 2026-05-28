import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { generateWeeklySummary } from '../../services/aiService.js';

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function WeeklySummaryCard({ profile, calorieTarget, macroTargets }) {
  const { user } = useAuth();
  const weekStart = mondayOf();
  const [collapsed, setCollapsed] = useState(false);
  const [summary, setSummary] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [weekStats, setWeekStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_summaries')
      .select('summary, created_at')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .eq('kind', 'weekly')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSummary(data.summary);
          setCreatedAt(data.created_at);
        }
      });
  }, [user, weekStart]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('food_log').select('date, calories, protein_g').eq('user_id', user.id).gte('date', weekStart),
      supabase.from('weight_log').select('date, weight_kg').eq('user_id', user.id).gte('date', weekStart).order('date'),
      supabase.from('activity_log').select('calories_burned').eq('user_id', user.id).gte('date', weekStart),
    ]).then(([f, w, a]) => {
      const byDate = {};
      let totalCal = 0, totalProtein = 0;
      (f.data || []).forEach((r) => {
        byDate[r.date] = (byDate[r.date] || 0) + (r.calories || 0);
        totalCal += r.calories || 0;
        totalProtein += Number(r.protein_g || 0);
      });
      const daysLogged = Object.keys(byDate).length;
      const daysHitGoal = Object.values(byDate).filter((c) => Math.abs(c - calorieTarget) <= 200).length;
      const avgCalories = daysLogged ? Math.round(totalCal / daysLogged) : 0;
      const avgProtein = daysLogged ? Math.round(totalProtein / daysLogged) : 0;
      const weights = w.data || [];
      const weightChange = weights.length >= 2 ? +(weights[weights.length - 1].weight_kg - weights[0].weight_kg).toFixed(1) : 0;
      const activitySessions = (a.data || []).length;
      const caloriesBurned = (a.data || []).reduce((acc, r) => acc + (r.calories_burned || 0), 0);
      setWeekStats({
        daysLogged,
        avgCalories,
        calorieGoal: calorieTarget,
        daysHitGoal,
        avgProtein,
        proteinGoal: macroTargets?.protein_g || 0,
        weightChange,
        activitySessions,
        caloriesBurned,
      });
    });
  }, [user, weekStart, calorieTarget, macroTargets?.protein_g]);

  const generate = async () => {
    if (!weekStats) return;
    setBusy(true);
    setError(null);
    try {
      const text = await generateWeeklySummary(weekStats);
      setSummary(text);
      setCreatedAt(new Date().toISOString());
      if (user) {
        await supabase.from('ai_summaries').upsert(
          { user_id: user.id, week_start: weekStart, kind: 'weekly', summary: text },
          { onConflict: 'user_id,week_start,kind' }
        );
      }
    } catch (e) {
      setError('AI features unavailable — check your server connection');
    } finally {
      setBusy(false);
    }
  };

  if (weekStats && weekStats.daysLogged < 3 && !summary) {
    return null;
  }

  return (
    <section className="card p-5" data-testid="weekly-summary">
      <div className="flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2">✨ Your week in review</div>
        <button onClick={() => setCollapsed((c) => !c)} className="text-sm opacity-60 hover:opacity-100">
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>
      {!collapsed && (
        <div className="mt-3 space-y-3">
          {summary ? (
            <>
              <p className="text-sm leading-relaxed">{summary}</p>
              <div className="text-xs flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                <span>Generated {createdAt ? new Date(createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : ''}</span>
                <button onClick={generate} disabled={busy} className="underline hover:no-underline">Regenerate</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Get an AI-generated recap of your past week.
              </p>
              <button onClick={generate} disabled={busy} className="btn-primary w-full" data-testid="weekly-generate">
                {busy ? 'Analyzing your week…' : 'Generate summary'}
              </button>
            </>
          )}
          {error && <div className="text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>
      )}
    </section>
  );
}
