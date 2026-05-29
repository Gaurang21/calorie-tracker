import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FoodLog, Meal, ISODate } from '../types/db';

export interface FoodTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type FoodLogByMeal = Record<Meal, FoodLog[]>;

export interface UseFoodLogResult {
  entries: FoodLog[];
  byMeal: FoodLogByMeal;
  totals: FoodTotals;
  loading: boolean;
  error: unknown;
  addEntry: (entry: Partial<FoodLog>) => Promise<FoodLog | null>;
  addEntries: (rows: Partial<FoodLog>[]) => Promise<FoodLog[]>;
  deleteEntry: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useFoodLog(date: ISODate): UseFoodLogResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!user || !date) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('food_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setEntries((data as FoodLog[]) || []);
    } catch (e) {
      setError(e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(async (entry: Partial<FoodLog>): Promise<FoodLog | null> => {
    if (!user) return null;
    const payload = { ...entry, user_id: user.id, date };
    const { data, error: err } = await supabase
      .from('food_log')
      .insert(payload)
      .select()
      .single();
    if (err) { setError(err); return null; }
    setEntries((prev) => [...prev, data as FoodLog]);
    return data as FoodLog;
  }, [user, date]);

  const addEntries = useCallback(async (rows: Partial<FoodLog>[]): Promise<FoodLog[]> => {
    if (!user || !rows?.length) return [];
    const payload = rows.map((r) => ({ ...r, user_id: user.id, date }));
    const { data, error: err } = await supabase
      .from('food_log')
      .insert(payload)
      .select();
    if (err) { setError(err); return []; }
    const added = (data as FoodLog[]) || [];
    setEntries((prev) => [...prev, ...added]);
    return added;
  }, [user, date]);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const { error: err } = await supabase
      .from('food_log')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (err) setError(err);
  }, [user]);

  const totals: FoodTotals = entries.reduce<FoodTotals>(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein_g: acc.protein_g + Number(e.protein_g || 0),
      carbs_g: acc.carbs_g + Number(e.carbs_g || 0),
      fat_g: acc.fat_g + Number(e.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const byMeal: FoodLogByMeal = entries.reduce<FoodLogByMeal>((acc, e) => {
    acc[e.meal].push(e);
    return acc;
  }, { breakfast: [], lunch: [], dinner: [], snacks: [] });

  return { entries, byMeal, totals, loading, error, addEntry, addEntries, deleteEntry, reload: load };
}
