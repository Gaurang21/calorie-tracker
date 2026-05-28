import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Flame, Droplet, Plus, Activity, TrendingUp } from 'lucide-react';
import { useProfile } from '../hooks/useProfile.js';
import { useFoodLog } from '../hooks/useFoodLog.js';
import { useActivityLog } from '../hooks/useActivityLog.js';
import { useWaterLog } from '../hooks/useWaterLog.js';
import { useDailyTargets } from '../hooks/useDailyTargets.js';
import { useStreak } from '../hooks/useStreak.js';
import { useOllama } from '../hooks/useOllama.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CalorieRing from '../components/common/CalorieRing.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import WeeklySummaryCard from '../components/ai/WeeklySummaryCard.jsx';
import DailyInsightCard from '../components/ai/DailyInsightCard.jsx';
import GoalPacingCard from '../components/ai/GoalPacingCard.jsx';
import MealSuggestionsCard from '../components/ai/MealSuggestionsCard.jsx';
import WorkoutSuggestionCard from '../components/ai/WorkoutSuggestionCard.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const nav = useNavigate();
  const date = todayISO();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { entries: foodEntries, totals } = useFoodLog(date);
  const { totalBurned } = useActivityLog(date);
  const { amountMl, add } = useWaterLog(date);
  const { calorieTarget, macros } = useDailyTargets(profile);
  const { enabled } = useOllama();
  const streak = useStreak();

  const net = totals.calories - totalBurned;
  const waterTarget = profile?.water_target_ml || 2500;
  const netGoalDiff = net - calorieTarget;
  const netOk = Math.abs(netGoalDiff) <= 100;
  const remainingCalories = Math.max(0, calorieTarget - net);
  const macroGaps = {
    protein: Math.max(0, (macros?.protein_g || 0) - Math.round(totals.protein_g)),
    carbs: Math.max(0, (macros?.carbs_g || 0) - Math.round(totals.carbs_g)),
    fat: Math.max(0, (macros?.fat_g || 0) - Math.round(totals.fat_g)),
  };
  const recentFoodNames = foodEntries.slice(-5).map((e) => e.name);

  const [activityRecent, setActivityRecent] = useState(null);
  useEffect(() => {
    if (!user) return;
    const since = new Date(); since.setDate(since.getDate() - 7);
    supabase
      .from('activity_log')
      .select('date, activity_type')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .then(({ data }) => {
        const sessions = data || [];
        const lastDate = sessions[0]?.date;
        const daysSinceLast = lastDate
          ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
          : 99;
        setActivityRecent({
          recentSessions: sessions.slice(0, 3).map((s) => s.activity_type),
          lastSession: sessions[0]?.activity_type || null,
          daysSinceLast,
        });
      });
  }, [user]);

  const logMealSuggestion = async (meal) => {
    if (!user) return;
    await supabase.from('food_log').insert({
      user_id: user.id,
      date,
      meal: 'lunch',
      name: meal.name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      source: 'manual',
    });
    nav('/log');
  };

  const waterPct = Math.round((amountMl / waterTarget) * 100);

  return (
    <div className="space-y-5 stagger">
      <header className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1.5">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="text-[28px] font-bold tracking-tight2">
            {greeting()}, {profile?.name || 'there'}
          </h1>
        </div>
        {streak > 0 && (
          <div className="chip chip-brand">
            <Flame size={14} strokeWidth={2.4} />
            <span className="tabular">{streak} day streak</span>
          </div>
        )}
      </header>

      {/* HERO — calorie ring + key stats */}
      <section className="card p-7">
        <CalorieRing eaten={totals.calories} target={calorieTarget} burned={totalBurned} />
        <div className="hairline mt-6" />
        <div className="grid grid-cols-3 mt-5 text-center">
          <Stat label="Eaten" value={totals.calories} />
          <Stat label="Burned" value={totalBurned} />
          <Stat label="Goal" value={calorieTarget} />
        </div>
      </section>

      {/* Macros */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[17px] tracking-tight2">Macros</h2>
          <div className="eyebrow">EAT</div>
        </div>
        <div className="space-y-4">
          <ProgressBar label="Protein" value={Math.round(totals.protein_g)} max={macros.protein_g} right={`${Math.round(totals.protein_g)}g / ${macros.protein_g}g`} color="var(--sky)" />
          <ProgressBar label="Carbs" value={Math.round(totals.carbs_g)} max={macros.carbs_g} right={`${Math.round(totals.carbs_g)}g / ${macros.carbs_g}g`} color="var(--amber)" />
          <ProgressBar label="Fat" value={Math.round(totals.fat_g)} max={macros.fat_g} right={`${Math.round(totals.fat_g)}g / ${macros.fat_g}g`} color="var(--ruby)" />
        </div>
      </section>

      {/* Water */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[17px] tracking-tight2 flex items-center gap-2">
            <Droplet size={18} strokeWidth={2} className="text-sky-500" style={{ color: 'var(--sky)' }} />
            Water
          </h2>
          <div className="eyebrow tabular">{waterPct}%</div>
        </div>
        <ProgressBar value={amountMl} max={waterTarget} right={`${amountMl} / ${waterTarget} ml`} color="var(--sky)" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => add(ml)} className="btn-secondary text-sm">+{ml}</button>
          ))}
          <button onClick={() => add(-250)} className="btn-secondary text-sm">−250</button>
        </div>
      </section>

      {/* Net calories — featured */}
      <section className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow mb-2">Net calories</div>
            <div className="hero-num text-[44px] tabular">{net}</div>
            <div className="text-[13px] mt-2 tabular" style={{ color: 'var(--text-muted)' }}>
              Goal {calorieTarget}
            </div>
          </div>
          <div
            className="chip"
            style={netOk
              ? { color: 'var(--brand)', backgroundColor: 'var(--brand-soft)', borderColor: 'transparent' }
              : { color: 'var(--warning)', borderColor: 'var(--warning)', backgroundColor: 'transparent' }}
          >
            {netOk ? 'On Target' : netGoalDiff > 0 ? 'Over' : 'Under'}
          </div>
        </div>
      </section>

      {enabled('daily_insights') && (
        <DailyInsightCard
          todayData={{
            caloriesEaten: totals.calories,
            caloriesBurned: totalBurned,
            proteinEaten: Math.round(totals.protein_g),
            calorieGoal: calorieTarget,
            proteinGoal: macros?.protein_g || 0,
            timeOfDay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }}
          recentHistory={{ summary: `${streak} day streak`, trigger: 'default' }}
        />
      )}

      {enabled('goal_pacing') && (
        <GoalPacingCard profile={profile} calorieTarget={calorieTarget} />
      )}

      {enabled('meal_suggestions') && (
        <MealSuggestionsCard
          remainingCalories={remainingCalories}
          macroGaps={macroGaps}
          recentFoods={recentFoodNames}
          onLogMeal={logMealSuggestion}
        />
      )}

      {enabled('weekly_summary') && (
        <WeeklySummaryCard profile={profile} calorieTarget={calorieTarget} macroTargets={macros} />
      )}

      {enabled('workout_suggestions') && activityRecent && activityRecent.daysSinceLast >= 3 && (
        <WorkoutSuggestionCard
          kind="movement"
          activityLog={activityRecent}
          calorieData={{
            burned: totalBurned,
            protein: Math.round(totals.protein_g),
            proteinGoal: macros?.protein_g || 0,
          }}
        />
      )}

      <button
        onClick={() => nav('/log')}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-30 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-medium text-[15px] transition active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #5fd589, #30D158)',
          boxShadow: '0 10px 28px var(--brand-glow), 0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        Log food
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      <div className="text-[20px] font-semibold tabular" style={{ letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
