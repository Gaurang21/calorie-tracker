import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()} · TODAY</div>
          <h1 className="display text-[36px] leading-none uplabel" style={{ letterSpacing: '0.04em' }}>
            {greeting().split(' ')[1] || greeting()}, {profile?.name || 'athlete'}
          </h1>
        </div>
        {streak > 0 && (<div className="chip chip-brand">🔥 {streak}D STREAK</div>)}
      </header>

      <section className="card-accent p-6">
        <div className="eyebrow mb-4">CALORIE BUDGET</div>
        <CalorieRing eaten={totals.calories} target={calorieTarget} burned={totalBurned} />
        <div className="hairline mt-5" />
        <div className="grid grid-cols-3 mt-4 text-center">
          {[['EATEN', totals.calories], ['BURNED', totalBurned], ['GOAL', calorieTarget]].map(([l,v]) => (
            <div key={l}>
              <div className="eyebrow mb-1">{l}</div>
              <div className="display text-[24px] tabular">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="display text-[18px] uplabel">NUTRITION</h2>
          <div className="eyebrow">MACROS</div>
        </div>
        <div className="space-y-4">
          <ProgressBar label="Protein" value={Math.round(totals.protein_g)} max={macros.protein_g} right={`${Math.round(totals.protein_g)}g / ${macros.protein_g}g`} color="var(--cyan)" />
          <ProgressBar label="Carbs" value={Math.round(totals.carbs_g)} max={macros.carbs_g} right={`${Math.round(totals.carbs_g)}g / ${macros.carbs_g}g`} color="var(--amber)" />
          <ProgressBar label="Fat" value={Math.round(totals.fat_g)} max={macros.fat_g} right={`${Math.round(totals.fat_g)}g / ${macros.fat_g}g`} color="var(--magenta)" />
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="display text-[18px] uplabel">HYDRATION</h2>
          <div className="display text-[16px] tabular">{Math.round((amountMl/waterTarget)*100)}%</div>
        </div>
        <ProgressBar value={amountMl} max={waterTarget} right={`${amountMl} / ${waterTarget} ml`} color="var(--cyan)" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => add(ml)} className="btn-secondary">+{ml}</button>
          ))}
          <button onClick={() => add(-250)} className="btn-secondary">−250</button>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow mb-2">Net calories</div>
            <div className="hero-num text-[48px]" style={{ color: 'var(--brand)' }}>{net}</div>
            <div className="text-[12px] mt-1 tabular font-medium" style={{ color: 'var(--text-muted)' }}>GOAL {calorieTarget}</div>
          </div>
          <span className="chip" style={netOk
            ? { color: 'var(--brand)', backgroundColor: 'var(--brand-soft)', borderColor: 'transparent' }
            : { color: 'var(--warning)', borderColor: 'var(--warning)', backgroundColor: 'transparent' }}>
            {netOk ? 'ON TARGET' : netGoalDiff > 0 ? 'OVER' : 'UNDER'}
          </span>
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
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30 btn-primary px-6 py-3.5 text-[13px]"
      >
        <span className="text-lg leading-none">＋</span> LOG FOOD
      </button>
    </div>
  );
}
