import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ISODate, WaterLog } from '../types/db';

export interface UseWaterLogResult {
  amountMl: number;
  setAmount: (nextMl: number) => Promise<void>;
  add: (deltaMl: number) => Promise<void>;
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

export function useWaterLog(date: ISODate): UseWaterLogResult {
  const { user } = useAuth();
  const [amountMl, setAmountMl] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!user || !date) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('water_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      if (err) throw err;
      setAmountMl((data as WaterLog | null)?.amount_ml ?? 0);
    } catch (e) {
      setError(e);
      setAmountMl(0);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  const setAmount = useCallback(async (nextMl: number): Promise<void> => {
    if (!user) return;
    const value = Math.max(0, Math.round(nextMl));
    setAmountMl(value);
    const { error: err } = await supabase
      .from('water_log')
      .upsert(
        { user_id: user.id, date, amount_ml: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );
    if (err) setError(err);
  }, [user, date]);

  const add = useCallback((deltaMl: number) => setAmount(amountMl + deltaMl), [amountMl, setAmount]);

  return { amountMl, setAmount, add, loading, error, reload: load };
}
