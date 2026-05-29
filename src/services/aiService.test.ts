import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('aiService router', () => {
  it('defaults to ollama when VITE_AI_PROVIDER is unset', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', '');
    const svc = await import('./aiService');
    expect(svc.provider).toBe('ollama');
    expect(svc.providerLabel).toBe('Ollama');
  });

  it('selects groq when VITE_AI_PROVIDER=groq', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'groq');
    const svc = await import('./aiService');
    expect(svc.provider).toBe('groq');
    expect(svc.providerLabel).toBe('Groq');
  });

  it('is case-insensitive', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'GROQ');
    const svc = await import('./aiService');
    expect(svc.provider).toBe('groq');
  });

  it('exports all 8 feature functions plus testConnection', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'ollama');
    const svc = await import('./aiService');
    for (const fn of [
      'parseNaturalLanguageFood',
      'generateWeeklySummary',
      'answerDataQuestion',
      'suggestMeals',
      'suggestFoodSwap',
      'generateDailyInsight',
      'generateGoalPacingMessage',
      'generateWorkoutSuggestion',
      'testConnection',
    ]) {
      expect(typeof (svc as unknown as Record<string, unknown>)[fn]).toBe('function');
    }
  });
});
