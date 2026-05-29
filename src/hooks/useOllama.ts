import { useCallback, useEffect, useState } from 'react';
import { testConnection } from '../services/aiService';
import { useProfile } from './useProfile';
import type { AIFeatureFlags } from '../types/db';
import type { TestConnectionResult } from '../types/ai';

type RequiredFlags = Required<AIFeatureFlags>;

const DEFAULT_FLAGS: RequiredFlags = {
  weekly_summary: true,
  ask_anything: true,
  meal_suggestions: true,
  food_swap: true,
  daily_insights: true,
  goal_pacing: true,
  workout_suggestions: true,
};

export interface OllamaStatus {
  checked: boolean;
  ok: boolean;
  models: string[];
  error: string | null;
}

export interface CheckOverride {
  url?: string | null;
  apiKey?: string | null;
}

export interface UseOllamaResult {
  status: OllamaStatus;
  flags: RequiredFlags;
  enabled: (name: keyof RequiredFlags) => boolean;
  check: (override?: CheckOverride) => Promise<TestConnectionResult>;
  setFlag: (name: keyof RequiredFlags, value: boolean) => Promise<void>;
}

export function useOllama(): UseOllamaResult {
  const { profile, update } = useProfile();
  const [status, setStatus] = useState<OllamaStatus>({ checked: false, ok: false, models: [], error: null });

  const flags: RequiredFlags = { ...DEFAULT_FLAGS, ...(profile?.ai_features_enabled || {}) };

  const check = useCallback(async (override?: CheckOverride): Promise<TestConnectionResult> => {
    setStatus((s) => ({ ...s, checked: false, error: null }));
    const url = override?.url ?? profile?.ollama_url ?? undefined;
    const apiKey = override?.apiKey ?? profile?.ollama_api_key ?? undefined;
    const res = await testConnection({ url, apiKey });
    setStatus({ checked: true, ok: res.ok, models: res.models || [], error: res.error || null });
    return res;
  }, [profile?.ollama_url, profile?.ollama_api_key]);

  useEffect(() => {
    if (profile && !status.checked) check();
  }, [profile, status.checked, check]);

  const setFlag = useCallback(async (name: keyof RequiredFlags, value: boolean): Promise<void> => {
    const next = { ...flags, [name]: value };
    await update({ ai_features_enabled: next });
  }, [flags, update]);

  const enabled = (name: keyof RequiredFlags): boolean => flags[name] !== false;

  return { status, flags, enabled, check, setFlag };
}
