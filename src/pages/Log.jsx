import { useState } from 'react';
import FoodLogSection from '../components/log/FoodLogSection.jsx';
import ActivityLogSection from '../components/activity/ActivityLogSection.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import { useProfile } from '../hooks/useProfile.js';
import { useFoodLog } from '../hooks/useFoodLog.js';
import { useActivityLog } from '../hooks/useActivityLog.js';
import { useWaterLog } from '../hooks/useWaterLog.js';
import { useDailyTargets } from '../hooks/useDailyTargets.js';

const todayISO = () => new Date().toISOString().slice(0, 10);
const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];

export default function Log() {
  const [date, setDate] = useState(todayISO());
  const { profile } = useProfile();
  const { byMeal, totals, addEntry, addEntries, deleteEntry } = useFoodLog(date);
  const { entries: activity, totalBurned, addEntry: addActivity, deleteEntry: deleteActivity } = useActivityLog(date);
  const { amountMl, add: addWater } = useWaterLog(date);
  const { calorieTarget, currentWeightKg } = useDailyTargets(profile);

  const waterTarget = profile?.water_target_ml || 2500;
  const net = totals.calories - totalBurned;
  const netOk = net <= calorieTarget;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Daily log</h1>
        <input
          type="date"
          data-testid="log-date"
          className="input max-w-[180px]"
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
        />
      ))}

      <ActivityLogSection
        entries={activity}
        onAdd={addActivity}
        onDelete={deleteActivity}
        weightKg={currentWeightKg || 70}
      />

      <section className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">💧 Water</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{amountMl}ml / {waterTarget}ml</div>
        </div>
        <ProgressBar label="" value={amountMl} max={waterTarget} right={`${Math.round((amountMl / waterTarget) * 100)}%`} color="#0ea5e9" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} className="btn-secondary text-sm">+{ml}ml</button>
          ))}
          <button onClick={() => addWater(-250)} className="btn-secondary text-sm">−250ml</button>
        </div>
      </section>

      <section className="card p-4 font-mono text-sm">
        <div className="flex justify-between"><span>Calories eaten</span><span>{totals.calories} kcal</span></div>
        <div className="flex justify-between"><span>Calories burned</span><span>{totalBurned} kcal</span></div>
        <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
        <div className="flex justify-between font-semibold">
          <span>Net calories</span>
          <span data-testid="net-calories">{net} kcal · {netOk ? '✅' : '⚠️'} goal {calorieTarget}</span>
        </div>
      </section>
    </div>
  );
}
