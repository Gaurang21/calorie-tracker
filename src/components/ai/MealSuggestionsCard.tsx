import { useState } from 'react';
import { suggestMeals } from '../../services/aiService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MacroGaps, MealSuggestion } from '../../types/ai';

interface Props {
  remainingCalories: number;
  macroGaps: MacroGaps;
  recentFoods: string[];
  onLogMeal?: (meal: MealSuggestion) => void;
}

export default function MealSuggestionsCard({ remainingCalories, macroGaps, recentFoods, onLogMeal }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MealSuggestion[] | null>(null);

  if (remainingCalories <= 200) return null;

  const fetchSuggestions = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await suggestMeals(remainingCalories, macroGaps, recentFoods);
      setSuggestions(res.suggestions || []);
    } catch (e) {
      setError('AI features unavailable — check your server connection');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4" data-testid="meal-suggestions">
      <div className="flex items-center justify-between">
        <div className="font-semibold">🍽️ What should I eat next?</div>
        {suggestions && (
          <button onClick={fetchSuggestions} disabled={busy} className="text-sm opacity-60 hover:opacity-100">
            ↻ Refresh
          </button>
        )}
      </div>
      <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
        {remainingCalories} kcal left · need <b>{macroGaps.protein}g</b> protein, <b>{macroGaps.carbs}g</b> carbs, <b>{macroGaps.fat}g</b> fat
      </div>

      {!suggestions && (
        <Button onClick={fetchSuggestions} disabled={busy} className="w-full mt-3" data-testid="meal-suggest-btn">
          {busy ? 'Finding meals that fit…' : 'Suggest a meal'}
        </Button>
      )}

      {suggestions && (
        <div className="space-y-2 mt-3" data-testid="meal-suggestions-list">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {s.calories} kcal · P{s.protein_g} C{s.carbs_g} F{s.fat_g}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onLogMeal?.(s)}>Log this</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{error}</div>}
    </Card>
  );
}
