import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useFoodLog } from '../hooks/useFoodLog';
import { useActivityLog } from '../hooks/useActivityLog';
import { useWaterLog } from '../hooks/useWaterLog';
import { useDailyTargets } from '../hooks/useDailyTargets';
import { useStreak } from '../hooks/useStreak';
import { useOllama } from '../hooks/useOllama';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CalorieRing from '../components/common/CalorieRing';
import ProgressBar from '../components/common/ProgressBar';
import WeeklySummaryCard from '../components/ai/WeeklySummaryCard';
import DailyInsightCard from '../components/ai/DailyInsightCard';
import GoalPacingCard from '../components/ai/GoalPacingCard';
import MealSuggestionsCard from '../components/ai/MealSuggestionsCard';
import WorkoutSuggestionCard from '../components/ai/WorkoutSuggestionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ActivityLogContext } from '../types/ai';
import type { MealSuggestion } from '../types/ai';

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

  const [activityRecent, setActivityRecent] = useState<ActivityLogContext | null>(null);
  useEffect(() => {
    if (!user) return;
    const since = new Date(); since.setDate(since.getDate() - 7);
    supabase
      .from('activity_log')
      .select('date, activity_type')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .then(({ data }: { data: { date: string; activity_type: string }[] | null }) => {
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

  const logMealSuggestion = async (meal: MealSuggestion): Promise<void> => {
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
    <div className="space-y-5 stagger">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[12px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="text-[26px] font-bold tracking-tight">
            {greeting()}, {profile?.name || 'friend'} ✨
          </h1>
        </div>
        {streak > 0 && (<div className="chip chip-brand">🔥 {streak} day streak</div>)}
      </header>

      <Card variant="warm" className="p-6">
        <CalorieRing eaten={totals.calories} target={calorieTarget} burned={totalBurned} />
        <div className="grid grid-cols-3 mt-5 text-center">
          {[['eaten', totals.calories], ['burned', totalBurned], ['goal', calorieTarget]].map(([l,v]) => (
            <div key={l}>
              <div className="text-[11px] uppercase font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>{l}</div>
              <div className="text-[18px] font-bold tabular mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="font-semibold mb-4">Today's macros 🌱</div>
        <div className="space-y-3.5">
          <ProgressBar label="Protein" value={Math.round(totals.protein_g)} max={macros.protein_g} right={`${Math.round(totals.protein_g)}g / ${macros.protein_g}g`} color="var(--sky)" />
          <ProgressBar label="Carbs" value={Math.round(totals.carbs_g)} max={macros.carbs_g} right={`${Math.round(totals.carbs_g)}g / ${macros.carbs_g}g`} color="var(--amber)" />
          <ProgressBar label="Fat" value={Math.round(totals.fat_g)} max={macros.fat_g} right={`${Math.round(totals.fat_g)}g / ${macros.fat_g}g`} color="var(--ruby)" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Hydration 💧</div>
          <div className="text-[13px] tabular" style={{ color: 'var(--text-muted)' }}>{amountMl} / {waterTarget} ml</div>
        </div>
        <ProgressBar value={amountMl} max={waterTarget} right={`${Math.round((amountMl/waterTarget)*100)}%`} color="var(--sky)" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[250, 500, 750].map((ml) => (
            <Button key={ml} variant="secondary" size="sm" onClick={() => add(ml)}>+{ml}ml</Button>
          ))}
          <Button variant="secondary" size="sm" onClick={() => add(-250)}>−250ml</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] uppercase font-semibold tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Net calories</div>
            <div className="hero-num text-[42px]">{net}</div>
            <div className="text-[13px] mt-2 tabular" style={{ color: 'var(--text-muted)' }}>Goal {calorieTarget}</div>
          </div>
          <span className="chip" style={netOk ? { color: 'var(--sage)', backgroundColor: 'rgba(168,197,160,0.20)' } : { color: 'var(--warning)', backgroundColor: 'rgba(245,199,106,0.20)' }}>
            {netOk ? '✓ on track' : netGoalDiff > 0 ? 'a bit over' : 'still room'}
          </span>
        </div>
      </Card>

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

      <Button
        onClick={() => nav('/log')}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-30 px-6 py-3.5 text-[15px]"
      >
        <span className="text-lg leading-none">＋</span> Log food
      </Button>
    </div>
  );
}
