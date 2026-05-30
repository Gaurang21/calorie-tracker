import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import type { Meal, MealTemplate, FoodLog } from '../../types/db';

interface Props {
  meal: Meal;
  onSaveMany: (rows: Partial<FoodLog>[]) => Promise<unknown>;
}

export default function MealTemplatesTab({ meal, onSaveMany }: Props) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [selected, setSelected] = useState<MealTemplate | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => {
    if (!user) return;
    const { data } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTemplates((data as MealTemplate[]) || []);
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const logTemplate = async (): Promise<void> => {
    if (!selected) return;
    setBusy(true);
    const rows: Partial<FoodLog>[] = (selected.foods || []).map((f) => ({
      meal,
      name: f.name,
      calories: f.calories,
      protein_g: f.protein_g || 0,
      carbs_g: f.carbs_g || 0,
      fat_g: f.fat_g || 0,
      serving_size: f.serving_size || null,
      source: 'template',
    }));
    await onSaveMany(rows);
    setBusy(false);
  };

  const totalCals = (t: MealTemplate): number => (t.foods || []).reduce((acc, f) => acc + (f.calories || 0), 0);

  return (
    <div className="space-y-3">
      {templates.length === 0 && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No templates yet. Save a meal from the food log to create one.
        </div>
      )}
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => setSelected(t.id === selected?.id ? null : t)}
          className={`w-full text-left p-3 rounded-xl border transition ${selected?.id === t.id ? 'border-brand-500' : ''}`}
          style={{ borderColor: selected?.id === t.id ? 'var(--brand)' : 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{t.name}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{totalCals(t)} kcal</div>
          </div>
          {selected?.id === t.id && (
            <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {(t.foods || []).map((f, i) => (
                <li key={i}>{f.name} — {f.calories} kcal</li>
              ))}
            </ul>
          )}
        </button>
      ))}
      {selected && (
        <Button onClick={logTemplate} disabled={busy} className="w-full">
          {busy ? 'Logging…' : `Log "${selected.name}" as ${meal}`}
        </Button>
      )}
    </div>
  );
}
