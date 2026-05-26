import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useFoodLog(date) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setEntries(data || []);
    } catch (e) {
      setError(e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(async (entry) => {
    if (!user) return null;
    const payload = { ...entry, user_id: user.id, date };
    const { data, error: err } = await supabase
      .from('food_log')
      .insert(payload)
      .select()
      .single();
    if (err) { setError(err); return null; }
    setEntries((prev) => [...prev, data]);
    return data;
  }, [user, date]);

  const addEntries = useCallback(async (rows) => {
    if (!user || !rows?.length) return [];
    const payload = rows.map((r) => ({ ...r, user_id: user.id, date }));
    const { data, error: err } = await supabase
      .from('food_log')
      .insert(payload)
      .select();
    if (err) { setError(err); return []; }
    setEntries((prev) => [...prev, ...(data || [])]);
    return data || [];
  }, [user, date]);

  const deleteEntry = useCallback(async (id) => {
    if (!user) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const { error: err } = await supabase
      .from('food_log')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (err) setError(err);
  }, [user]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein_g: acc.protein_g + Number(e.protein_g || 0),
      carbs_g: acc.carbs_g + Number(e.carbs_g || 0),
      fat_g: acc.fat_g + Number(e.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const byMeal = entries.reduce((acc, e) => {
    (acc[e.meal] = acc[e.meal] || []).push(e);
    return acc;
  }, { breakfast: [], lunch: [], dinner: [], snacks: [] });

  return { entries, byMeal, totals, loading, error, addEntry, addEntries, deleteEntry, reload: load };
}
