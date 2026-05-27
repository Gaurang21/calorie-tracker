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
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{greeting()}, {profile?.name || 'friend'} 👋</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Here's your day at a glance.</div>
        </div>
        {streak > 0 && (
          <div className="chip">🔥 {streak} day streak</div>
        )}
      </header>

      <section className="card p-5">
        <CalorieRing eaten={totals.calories} target={calorieTarget} burned={totalBurned} />
        <div className="grid grid-cols-3 mt-4 text-center">
          <div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Eaten</div>
            <div className="font-semibold">{totals.calories}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Burned</div>
            <div className="font-semibold">{totalBurned}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Goal</div>
            <div className="font-semibold">{calorieTarget}</div>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="font-semibold mb-3">Macros</div>
        <div className="space-y-3">
          <ProgressBar label="Protein" value={Math.round(totals.protein_g)} max={macros.protein_g} right={`${Math.round(totals.protein_g)}g / ${macros.protein_g}g`} color="#3b82f6" />
          <ProgressBar label="Carbs" value={Math.round(totals.carbs_g)} max={macros.carbs_g} right={`${Math.round(totals.carbs_g)}g / ${macros.carbs_g}g`} color="#f59e0b" />
          <ProgressBar label="Fat" value={Math.round(totals.fat_g)} max={macros.fat_g} right={`${Math.round(totals.fat_g)}g / ${macros.fat_g}g`} color="#ef4444" />
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Water</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{amountMl}ml / {waterTarget}ml</div>
        </div>
        <ProgressBar label="" value={amountMl} max={waterTarget} right={`${Math.round((amountMl / waterTarget) * 100)}%`} color="#0ea5e9" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => add(ml)} className="btn-secondary text-sm">+{ml}ml</button>
          ))}
          <button onClick={() => add(-250)} className="btn-secondary text-sm">−250ml</button>
        </div>
      </section>

      <section className={`card p-5 ${netOk ? '' : 'border-amber-400'}`}>
        <div className="font-semibold mb-2">Net calories</div>
        <div className="text-3xl font-bold">{net}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Goal {calorieTarget} {netOk ? '✅' : netGoalDiff > 0 ? '⚠️ over' : '⚠️ under'}
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
        className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-30 btn-primary shadow-lg rounded-full px-5 py-3"
      >
        <span className="text-lg">＋</span> Log food
      </button>
    </div>
  );
}
