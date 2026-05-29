import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Meal, FoodLog, UserFood } from '../../types/db';

interface Props {
  meal: Meal;
  onSave: (entry: Partial<FoodLog>) => Promise<unknown>;
}

export default function ManualEntryTab({ meal, onSave }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [serving, setServing] = useState('');
  const [saveToFoods, setSaveToFoods] = useState(false);
  const [savedFoods, setSavedFoods] = useState<UserFood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('times_used', { ascending: false })
      .limit(20)
      .then(({ data }: { data: UserFood[] | null }) => setSavedFoods(data || []));
  }, [user]);

  const matches = name
    ? savedFoods.filter((f) => f.name.toLowerCase().includes(name.toLowerCase())).slice(0, 5)
    : [];

  const applyMatch = (f: UserFood): void => {
    setName(f.name);
    setCalories(String(f.calories));
    setProtein(String(f.protein_g || 0));
    setCarbs(String(f.carbs_g || 0));
    setFat(String(f.fat_g || 0));
    setServing(f.serving_size || '');
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Name is required'); return; }
    const cals = Number(calories);
    if (!Number.isFinite(cals) || cals < 0) { setError('Calories must be a number'); return; }
    setBusy(true);
    try {
      const entry: Partial<FoodLog> = {
        meal,
        name: name.trim(),
        calories: Math.round(cals),
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
        serving_size: serving || null,
        source: 'manual',
      };
      await onSave(entry);
      if (saveToFoods && user) {
        const existing = savedFoods.find((f) => f.name.toLowerCase() === entry.name!.toLowerCase());
        if (existing) {
          await supabase.from('user_foods').update({ times_used: (existing.times_used || 1) + 1 }).eq('id', existing.id);
        } else {
          await supabase.from('user_foods').insert({
            user_id: user.id,
            name: entry.name,
            calories: entry.calories,
            protein_g: entry.protein_g,
            carbs_g: entry.carbs_g,
            fat_g: entry.fat_g,
            serving_size: entry.serving_size,
          });
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="relative">
        <Label htmlFor="food-name">Food name</Label>
        <Input id="food-name" data-testid="food-name" value={name} onChange={(e) => setName(e.target.value)} required />
        {matches.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 rounded-2xl max-h-48 overflow-auto"
            style={{ backgroundColor: 'var(--surface)', boxShadow: '0 4px 24px rgba(120,95,70,0.06)' }}>
            {matches.map((m) => (
              <button key={m.id} type="button" onClick={() => applyMatch(m)} className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-sm">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.calories} kcal · {m.serving_size || ''}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="calories">Calories</Label>
          <Input id="calories" data-testid="calories" type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="serving">Serving size</Label>
          <Input id="serving" value={serving} onChange={(e) => setServing(e.target.value)} placeholder="e.g. 1 cup" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="protein">Protein (g)</Label>
          <Input id="protein" type="number" min="0" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="carbs">Carbs (g)</Label>
          <Input id="carbs" type="number" min="0" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="fat">Fat (g)</Label>
          <Input id="fat" type="number" min="0" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox checked={saveToFoods} onCheckedChange={(v) => setSaveToFoods(v === true)} />
        Save to My Foods
      </label>
      {error && <div data-testid="form-error" className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Saving…' : 'Save'}</Button>
    </form>
  );
}
