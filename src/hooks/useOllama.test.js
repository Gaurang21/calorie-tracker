import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('./useProfile.js', () => {
  let profile = {
    ollama_url: 'https://ollama.example.com',
    ollama_api_key: 'k',
    ai_features_enabled: { weekly_summary: true, food_swap: false },
  };
  const update = vi.fn(async (patch) => { profile = { ...profile, ...patch }; });
  return { useProfile: () => ({ profile, update }) };
});

vi.mock('../services/ollamaService.js', () => ({
  testConnection: vi.fn().mockResolvedValue({ ok: true, models: ['llama3.2'] }),
}));

import { useOllama } from './useOllama.js';
import { testConnection } from '../services/ollamaService.js';

describe('useOllama', () => {
  beforeEach(() => { testConnection.mockClear(); });

  it('runs an initial connection check using the profile', async () => {
    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.status.checked).toBe(true));
    expect(testConnection).toHaveBeenCalled();
    expect(result.current.status.ok).toBe(true);
    expect(result.current.status.models).toContain('llama3.2');
  });

  it('exposes feature flags with default-on behavior', async () => {
    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.status.checked).toBe(true));
    // weekly_summary: true (set), food_swap: false (set), others default true
    expect(result.current.enabled('weekly_summary')).toBe(true);
    expect(result.current.enabled('food_swap')).toBe(false);
    expect(result.current.enabled('ask_anything')).toBe(true);
  });

  it('setFlag updates via profile.update', async () => {
    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.status.checked).toBe(true));
    await act(async () => { await result.current.setFlag('meal_suggestions', false); });
  });

  it('check() can override url/apiKey', async () => {
    testConnection.mockResolvedValueOnce({ ok: false, error: 'no' });
    const { result } = renderHook(() => useOllama());
    await waitFor(() => expect(result.current.status.checked).toBe(true));
    await act(async () => {
      await result.current.check({ url: 'https://other.example.com', apiKey: 'x' });
    });
    expect(testConnection).toHaveBeenLastCalledWith({ url: 'https://other.example.com', apiKey: 'x' });
  });
});
