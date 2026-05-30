import { useState } from 'react';
import AddFoodModal from './AddFoodModal';
import FoodSwapSheet from '../ai/FoodSwapSheet';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOllama } from '../../hooks/useOllama';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Meal, FoodLog } from '../../types/db';
import type { MacroGaps } from '../../types/ai';

interface Props {
  meal: Meal;
  entries: FoodLog[];
  onAddEntry: (entry: Partial<FoodLog>) => Promise<unknown>;
  onAddEntries: (rows: Partial<FoodLog>[]) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  macroGaps: MacroGaps;
}

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: '🥣 Breakfast',
  lunch: '🥗 Lunch',
  dinner: '🍝 Dinner',
  snacks: '🍎 Snacks',
};

export default function FoodLogSection({ meal, entries, onAddEntry, onAddEntries, onDelete, macroGaps }: Props) {
  const { user } = useAuth();
  const { enabled } = useOllama();
  const [open, setOpen] = useState(false);
  const [swapFood, setSwapFood] = useState<FoodLog | null>(null);
  const total = entries.reduce((acc, e) => acc + (e.calories || 0), 0);

  const saveAsTemplate = async () => {
    if (!user || entries.length === 0) return;
    const name = prompt(`Name for this ${meal} template:`);
    if (!name) return;
    const foods = entries.map((e) => ({
      name: e.name,
      calories: e.calories,
      protein_g: Number(e.protein_g) || 0,
      carbs_g: Number(e.carbs_g) || 0,
      fat_g: Number(e.fat_g) || 0,
      serving_size: e.serving_size || null,
    }));
    await supabase.from('meal_templates').insert({ user_id: user.id, name, foods });
    alert('Template saved');
  };

  return (
    <Card className="p-4" data-testid={`meal-${meal}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{MEAL_LABELS[meal]}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} kcal</div>
      </div>
      <div className="space-y-2">
        {entries.length === 0 && (
          <div className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>Nothing logged yet</div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between text-sm">
            <div className="min-w-0">
              <div className="truncate">{e.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {e.calories} kcal · P{Math.round(e.protein_g || 0)} C{Math.round(e.carbs_g || 0)} F{Math.round(e.fat_g || 0)}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              {enabled('food_swap') && (
                <button
                  data-testid={`swap-btn-${e.id}`}
                  onClick={() => setSwapFood(e)}
                  className="text-xs opacity-60 hover:opacity-100"
                  aria-label={`Suggest swaps for ${e.name}`}
                >
                  Swap?
                </button>
              )}
              <button onClick={() => onDelete(e.id)} aria-label={`Delete ${e.name}`} className="opacity-60 hover:opacity-100">✕</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Button data-testid={`add-${meal}`} variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(true)}>+ Add food</Button>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={saveAsTemplate}>Save as template</Button>
        )}
      </div>
      <AddFoodModal
        open={open}
        onClose={() => setOpen(false)}
        meal={meal}
        onAddEntry={onAddEntry}
        onAddEntries={onAddEntries}
      />
      <FoodSwapSheet
        open={!!swapFood}
        onClose={() => setSwapFood(null)}
        food={swapFood}
        macroGaps={macroGaps}
        onSwap={async (s) => {
          if (!swapFood) return;
          await onDelete(swapFood.id);
          await onAddEntry({
            meal,
            name: s.name,
            calories: Math.round(s.calories),
            protein_g: s.protein_g || 0,
            carbs_g: s.carbs_g || 0,
            fat_g: s.fat_g || 0,
            source: 'manual',
          });
          setSwapFood(null);
        }}
      />
    </Card>
  );
}
