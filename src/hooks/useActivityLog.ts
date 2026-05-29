import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ActivityLog, ISODate } from '../types/db';

export interface UseActivityLogResult {
  entries: ActivityLog[];
  totalBurned: number;
  loading: boolean;
  error: unknown;
  addEntry: (entry: Partial<ActivityLog>) => Promise<ActivityLog | null>;
  deleteEntry: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useActivityLog(date: ISODate): UseActivityLogResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

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
      setEntries((data as ActivityLog[]) || []);
    } catch (e) {
      setError(e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(async (entry: Partial<ActivityLog>): Promise<ActivityLog | null> => {
    if (!user) return null;
    const payload = { ...entry, user_id: user.id, date };
    const { data, error: err } = await supabase
      .from('activity_log')
      .insert(payload)
      .select()
      .single();
    if (err) { setError(err); return null; }
    setEntries((prev) => [...prev, data as ActivityLog]);
    return data as ActivityLog;
  }, [user, date]);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
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
