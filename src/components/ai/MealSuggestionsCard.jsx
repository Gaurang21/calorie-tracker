import { useState } from 'react';
import { Utensils, RotateCw, Sparkles } from 'lucide-react';
import { suggestMeals } from '../../services/aiService.js';

export default function MealSuggestionsCard({ remainingCalories, macroGaps, recentFoods, onLogMeal }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

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
    <section className="card p-6" data-testid="meal-suggestions">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-[17px] tracking-tight2 flex items-center gap-2">
          <Utensils size={18} strokeWidth={2} style={{ color: 'var(--brand)' }} />
          What should I eat?
        </h2>
        {suggestions && (
          <button onClick={fetchSuggestions} disabled={busy} className="text-[13px] opacity-60 hover:opacity-100 transition flex items-center gap-1">
            <RotateCw size={13} strokeWidth={2} />
            Refresh
          </button>
        )}
      </div>
      <div className="text-[13px] tabular" style={{ color: 'var(--text-muted)' }}>
        {remainingCalories} kcal left · need <b>{macroGaps.protein}g</b> P · <b>{macroGaps.carbs}g</b> C · <b>{macroGaps.fat}g</b> F
      </div>

      {!suggestions && (
        <button onClick={fetchSuggestions} disabled={busy} className="btn-primary w-full mt-4" data-testid="meal-suggest-btn">
          <Sparkles size={16} strokeWidth={2.4} />
          {busy ? 'Finding meals that fit…' : 'Suggest a meal'}
        </button>
      )}

      {suggestions && (
        <div className="space-y-2 mt-4" data-testid="meal-suggestions-list">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface-2)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[15px]">{s.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
                  <div className="text-[12px] mt-1.5 tabular" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-soft)' }}>{s.calories}</span> kcal · P{s.protein_g} C{s.carbs_g} F{s.fat_g}
                  </div>
                </div>
                <button onClick={() => onLogMeal?.(s)} className="btn-secondary text-[12px] shrink-0 px-3 py-1.5">Log this</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{error}</div>}
    </section>
  );
}
