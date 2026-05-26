import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useActivityLog(date) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user || !date) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('activity_log')
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
      .from('activity_log')
      .insert(payload)
      .select()
      .single();
    if (err) { setError(err); return null; }
    setEntries((prev) => [...prev, data]);
    return data;
  }, [user, date]);

  const deleteEntry = useCallback(async (id) => {
    if (!user) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const { error: err } = await supabase
      .from('activity_log')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (err) setError(err);
  }, [user]);

  const totalBurned = entries.reduce((acc, e) => acc + (e.calories_burned || 0), 0);

  return { entries, totalBurned, loading, error, addEntry, deleteEntry, reload: load };
}
