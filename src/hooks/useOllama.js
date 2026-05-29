import { useCallback, useEffect, useState } from 'react';
import { testConnection } from '../services/aiService.js';
import { useProfile } from './useProfile.js';

const DEFAULT_FLAGS = {
  weekly_summary: true,
  ask_anything: true,
  meal_suggestions: true,
  food_swap: true,
  daily_insights: true,
  goal_pacing: true,
  workout_suggestions: true,
};

export function useOllama() {
  const { profile, update } = useProfile();
  const [status, setStatus] = useState({ checked: false, ok: false, models: [], error: null });

  const flags = { ...DEFAULT_FLAGS, ...(profile?.ai_features_enabled || {}) };

  const check = useCallback(async (override) => {
    setStatus((s) => ({ ...s, checked: false, error: null }));
    const url = override?.url ?? profile?.ollama_url ?? undefined;
    const apiKey = override?.apiKey ?? profile?.ollama_api_key ?? undefined;
    const res = await testConnection({ url, apiKey });
    setStatus({ checked: true, ok: res.ok, models: res.models || [], error: res.error || null });
    return res;
  }, [profile?.ollama_url, profile?.ollama_api_key]);

  useEffect(() => {
    // Run a passive check once profile is loaded.
    if (profile && !status.checked) check();
  }, [profile, status.checked, check]);

  const setFlag = useCallback(async (name, value) => {
    const next = { ...flags, [name]: value };
    await update({ ai_features_enabled: next });
  }, [flags, update]);

  const enabled = (name) => flags[name] !== false;

  return { status, flags, enabled, check, setFlag };
}
