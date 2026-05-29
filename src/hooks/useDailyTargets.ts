import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ageFromDob, bmr, tdee, goalCalorieTarget, macroTargets, type MacroTargets } from '../utils/calculations';
import type { Profile } from '../types/db';

export interface UseDailyTargetsResult {
  currentWeightKg: number | null;
  age: number | null;
  bmr: number | null;
  tdee: number | null;
  calorieTarget: number;
  macros: MacroTargets;
}

export function useDailyTargets(profile: Profile | null | undefined): UseDailyTargetsResult {
  const { user } = useAuth();
  const [currentWeightKg, setCurrentWeightKg] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('weight_log')
      .select('weight_kg, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .then(({ data }: { data: { weight_kg: number; date: string }[] | null }) => {
        if (cancelled) return;
        setCurrentWeightKg(data?.[0]?.weight_kg ?? null);
      });
    return () => { cancelled = true; };
  }, [user]);

  const age = ageFromDob(profile?.date_of_birth);
  const bmrValue = bmr({
    sex: profile?.sex,
    weightKg: Number(currentWeightKg || 0),
    heightCm: Number(profile?.height_cm || 0),
    age,
  });
  const tdeeValue = tdee({ bmr: bmrValue, activityLevel: profile?.activity_level });
  const calorieTarget =
    profile?.daily_calorie_override ||
    goalCalorieTarget({ tdee: tdeeValue, goalPace: profile?.goal_pace }) ||
    2000;
  const macros = macroTargets({
    calorieTarget,
    proteinPct: profile?.macro_protein_pct,
    carbsPct: profile?.macro_carbs_pct,
    fatPct: profile?.macro_fat_pct,
  });

  return { currentWeightKg, age, bmr: bmrValue, tdee: tdeeValue, calorieTarget, macros };
}
