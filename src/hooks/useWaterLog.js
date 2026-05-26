import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useWaterLog(date) {
  const { user } = useAuth();
  const [amountMl, setAmountMl] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setAmountMl(data?.amount_ml ?? 0);
    } catch (e) {
      setError(e);
      setAmountMl(0);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  const setAmount = useCallback(async (nextMl) => {
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

  const add = useCallback((deltaMl) => setAmount(amountMl + deltaMl), [amountMl, setAmount]);

  return { amountMl, setAmount, add, loading, error, reload: load };
}
