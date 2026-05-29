import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types/db';

const DEFAULT_PROFILE: Omit<Profile, 'id'> = {
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
  ollama_url: null,
  ollama_api_key: null,
  ai_features_enabled: {
    weekly_summary: true,
    ask_anything: true,
    meal_suggestions: true,
    food_swap: true,
    daily_insights: true,
    goal_pacing: true,
    workout_suggestions: true,
  },
  onboarding_complete: false,
};

export interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: unknown;
  update: (patch: Partial<Profile>) => Promise<Profile | null>;
  reload: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

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
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...DEFAULT_PROFILE })
          .select()
          .single();
        if (createErr) throw createErr;
        setProfile(created as Profile);
      } else {
        setProfile(data as Profile);
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

  const update = useCallback(async (patch: Partial<Profile>): Promise<Profile | null> => {
    if (!user) return null;
    const next: Profile = { ...(profile as Profile), ...patch, updated_at: new Date().toISOString() };
    next.id = user.id;
    setProfile(next);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .upsert({ ...next, id: user.id })
        .select()
        .single();
      if (err) throw err;
      setProfile(data as Profile);
      return data as Profile;
    } catch (e) {
      setError(e);
      return null;
    }
  }, [profile, user]);

  return { profile, loading, error, update, reload: load };
}
