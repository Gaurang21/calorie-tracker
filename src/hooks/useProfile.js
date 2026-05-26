import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const DEFAULT_PROFILE = {
  name: '',
  sex: null,
  date_of_birth: null,
  height_cm: null,
  activity_level: null,
  goal_weight_kg: null,
  goal_pace: 'maintain',
  units: 'metric',
  dark_mode: false,
  daily_calorie_override: null,
  macro_protein_pct: 30,
  macro_carbs_pct: 40,
  macro_fat_pct: 30,
  water_target_ml: 2500,
  gemini_api_key: null,
  onboarding_complete: false,
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (err && err.code !== 'PGRST116') throw err;
      if (!data) {
        // create a default profile row
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...DEFAULT_PROFILE })
          .select()
          .single();
        if (createErr) throw createErr;
        setProfile(created);
      } else {
        setProfile(data);
      }
    } catch (e) {
      setError(e);
      setProfile({ id: user.id, ...DEFAULT_PROFILE });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (patch) => {
    if (!user) return null;
    const next = { ...profile, ...patch, updated_at: new Date().toISOString() };
    setProfile(next);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...next })
        .select()
        .single();
      if (err) throw err;
      setProfile(data);
      return data;
    } catch (e) {
      setError(e);
      return null;
    }
  }, [profile, user]);

  return { profile, loading, error, update, reload: load };
}
