import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { localISO } from '../utils/date';
import type { ISODate } from '../types/db';

function isoDateOffset(days: number, base: Date = new Date()): ISODate {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return localISO(d);
}

export function useStreak(): number {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const sinceDate = isoDateOffset(60);
    supabase
      .from('food_log')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', sinceDate)
      .order('date', { ascending: false })
      .then(({ data }: { data: { date: ISODate }[] | null }) => {
        if (cancelled) return;
        const dates = new Set((data || []).map((r) => r.date));
        let count = 0;
        for (let i = 0; i < 60; i++) {
          const d = isoDateOffset(i);
          if (dates.has(d)) count += 1;
          else if (i === 0) continue;
          else break;
        }
        setStreak(count);
      });
    return () => { cancelled = true; };
  }, [user]);

  return streak;
}
