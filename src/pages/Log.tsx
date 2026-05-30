import { useState } from 'react';
import FoodLogSection from '../components/log/FoodLogSection';
import ActivityLogSection from '../components/activity/ActivityLogSection';
import ProgressBar from '../components/common/ProgressBar';
import WorkoutSuggestionCard from '../components/ai/WorkoutSuggestionCard';
import { useProfile } from '../hooks/useProfile';
import { useFoodLog } from '../hooks/useFoodLog';
import { useActivityLog } from '../hooks/useActivityLog';
import { useWaterLog } from '../hooks/useWaterLog';
import { useDailyTargets } from '../hooks/useDailyTargets';
import { useOllama } from '../hooks/useOllama';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Meal } from '../types/db';

const todayISO = () => new Date().toISOString().slice(0, 10);
const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export default function Log() {
  const [date, setDate] = useState(todayISO());
  const { profile } = useProfile();
  const { byMeal, totals, addEntry, addEntries, deleteEntry } = useFoodLog(date);
  const { entries: activity, totalBurned, addEntry: addActivity, deleteEntry: deleteActivity } = useActivityLog(date);
  const { amountMl, add: addWater } = useWaterLog(date);
  const { calorieTarget, currentWeightKg, macros } = useDailyTargets(profile);
  const { enabled } = useOllama();

  const waterTarget = profile?.water_target_ml || 2500;
  const net = totals.calories - totalBurned;
  const netOk = net <= calorieTarget;
  const macroGaps = {
    protein: Math.max(0, (macros?.protein_g || 0) - Math.round(totals.protein_g)),
    carbs: Math.max(0, (macros?.carbs_g || 0) - Math.round(totals.carbs_g)),
    fat: Math.max(0, (macros?.fat_g || 0) - Math.round(totals.fat_g)),
  };
  const lastActivity = activity[activity.length - 1];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Daily log</h1>
        <Input
          type="date"
          data-testid="log-date"
          className="max-w-[180px]"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </header>

      {MEALS.map((m) => (
        <FoodLogSection
          key={m}
          meal={m}
          entries={byMeal[m] || []}
          onAddEntry={addEntry}
          onAddEntries={addEntries}
          onDelete={deleteEntry}
          macroGaps={macroGaps}
        />
      ))}

      <ActivityLogSection
        entries={activity}
        onAdd={addActivity}
        onDelete={deleteActivity}
        weightKg={currentWeightKg || 70}
      />

      {enabled('workout_suggestions') && lastActivity && (
        <WorkoutSuggestionCard
          kind="recovery"
          activityLog={{
            recentSessions: activity.slice(-3).map((a) => a.activity_type),
            lastSession: lastActivity.activity_type,
            daysSinceLast: 0,
          }}
          calorieData={{
            burned: totalBurned,
            protein: Math.round(totals.protein_g),
            proteinGoal: macros?.protein_g || 0,
          }}
        />
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">💧 Water</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{amountMl}ml / {waterTarget}ml</div>
        </div>
        <ProgressBar label="" value={amountMl} max={waterTarget} right={`${Math.round((amountMl / waterTarget) * 100)}%`} color="#0ea5e9" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[250, 500, 750].map((ml) => (
            <Button key={ml} variant="secondary" size="sm" onClick={() => addWater(ml)}>+{ml}ml</Button>
          ))}
          <Button variant="secondary" size="sm" onClick={() => addWater(-250)}>−250ml</Button>
        </div>
      </Card>

      <Card className="p-4 font-mono text-sm">
        <div className="flex justify-between"><span>Calories eaten</span><span>{totals.calories} kcal</span></div>
        <div className="flex justify-between"><span>Calories burned</span><span>{totalBurned} kcal</span></div>
        <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
        <div className="flex justify-between font-semibold">
          <span>Net calories</span>
          <span data-testid="net-calories">{net} kcal · {netOk ? '✅' : '⚠️'} goal {calorieTarget}</span>
        </div>
      </Card>
    </div>
  );
}
