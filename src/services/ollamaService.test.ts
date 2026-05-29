import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const originalFetch = global.fetch;
let fetchMock: MockInstance;

beforeEach(() => {
  fetchMock = vi.fn() as unknown as MockInstance;
  global.fetch = fetchMock as unknown as typeof fetch;
  vi.stubEnv('VITE_OLLAMA_URL', 'https://test-ollama.example.com');
  vi.stubEnv('VITE_OLLAMA_API_KEY', 'test-key');
  vi.stubEnv('VITE_E2E', '');
  vi.resetModules();
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

async function loadService() {
  return await import('./ollamaService');
}

function mockResponse(body: unknown, ok = true, status = 200): void {
  (fetchMock as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

describe('ollamaService', () => {
  describe('parseNaturalLanguageFood', () => {
    it('returns parsed items array', async () => {
      const svc = await loadService();
      mockResponse({ response: JSON.stringify({ items: [{ name: 'Toast', serving: '1 slice', calories: 80, protein_g: 3, carbs_g: 14, fat_g: 1 }] }) });
      const res = await svc.parseNaturalLanguageFood('a slice of toast');
      expect(res).toHaveProperty('items');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].name).toBe('Toast');
    });

    it('handles multi-food input', async () => {
      const svc = await loadService();
      mockResponse({ response: JSON.stringify({ items: [
        { name: 'Oatmeal', serving: '1 bowl', calories: 250, protein_g: 8, carbs_g: 45, fat_g: 5 },
        { name: 'Banana', serving: '1 medium', calories: 105, protein_g: 1, carbs_g: 27, fat_g: 0 },
      ] }) });
      const res = await svc.parseNaturalLanguageFood('oatmeal and a banana');
      expect(res.items).toHaveLength(2);
    });

    it('throws when ollama returns invalid JSON', async () => {
      const svc = await loadService();
      mockResponse({ response: 'not json at all' });
      await expect(svc.parseNaturalLanguageFood('x')).rejects.toThrow(/invalid JSON/);
    });

    it('throws when ollama is unreachable (fetch error)', async () => {
      const svc = await loadService();
      (fetchMock as unknown as { mockRejectedValueOnce: (v: unknown) => void }).mockRejectedValueOnce(new Error('network down'));
      await expect(svc.parseNaturalLanguageFood('x')).rejects.toThrow();
    });
  });

  describe('generateWeeklySummary', () => {
    it('returns a non-empty string', async () => {
      const svc = await loadService();
      mockResponse({ response: 'Great week — you logged 6 of 7 days.' });
      const res = await svc.generateWeeklySummary({
        daysLogged: 6, avgCalories: 2000, calorieGoal: 2000, daysHitGoal: 4,
        avgProtein: 130, proteinGoal: 150, weightChange: -0.4, activitySessions: 3, caloriesBurned: 900,
      });
      expect(typeof res).toBe('string');
      expect(res.length).toBeGreaterThan(0);
    });
  });

  describe('answerDataQuestion', () => {
    it('returns string response', async () => {
      const svc = await loadService();
      mockResponse({ response: 'You averaged 1950 cal/day last week.' });
      const res = await svc.answerDataQuestion('How many calories last week?', { avg: 1950 });
      expect(typeof res).toBe('string');
    });
  });

  describe('suggestMeals', () => {
    it('returns 3 meal suggestions', async () => {
      const svc = await loadService();
      mockResponse({ response: JSON.stringify({ suggestions: [
        { name: 'A', description: 'x', calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10 },
        { name: 'B', description: 'y', calories: 350, protein_g: 25, carbs_g: 35, fat_g: 12 },
        { name: 'C', description: 'z', calories: 400, protein_g: 30, carbs_g: 40, fat_g: 14 },
      ] }) });
      const res = await svc.suggestMeals(800, { protein: 50, carbs: 80, fat: 20 }, ['oatmeal']);
      expect(res.suggestions).toHaveLength(3);
    });
  });

  describe('suggestFoodSwap', () => {
    it('returns 3 swap suggestions', async () => {
      const svc = await loadService();
      mockResponse({ response: JSON.stringify({ swaps: [
        { name: 'A', calories: 200, protein_g: 25, carbs_g: 5, fat_g: 8, reason: 'r1' },
        { name: 'B', calories: 210, protein_g: 22, carbs_g: 10, fat_g: 9, reason: 'r2' },
        { name: 'C', calories: 220, protein_g: 20, carbs_g: 15, fat_g: 10, reason: 'r3' },
      ] }) });
      const res = await svc.suggestFoodSwap({ name: 'pizza', calories: 250, protein_g: 10 }, { protein: 30, carbs: 0, fat: 0 });
      expect(res.swaps).toHaveLength(3);
      expect(res.swaps[0]).toHaveProperty('reason');
    });
  });

  describe('generateDailyInsight', () => {
    it('returns one-sentence insight string', async () => {
      const svc = await loadService();
      mockResponse({ response: "You're 70% of the way to your protein goal." });
      const res = await svc.generateDailyInsight(
        { caloriesEaten: 1500, caloriesBurned: 200, proteinEaten: 100, calorieGoal: 2000, proteinGoal: 150, timeOfDay: '18:00' },
        { summary: '5 day streak', trigger: 'protein under 60%' }
      );
      expect(typeof res).toBe('string');
    });
  });

  describe('generateGoalPacingMessage', () => {
    it('returns coaching string', async () => {
      const svc = await loadService();
      mockResponse({ response: 'On track — keep it up.' });
      const res = await svc.generateGoalPacingMessage(
        { pace: 'Lose 0.5 kg/week', weeklyCalorieTarget: -3850 },
        { currentDeficit: -2000, daysElapsed: 3, projectedWeeklyDeficit: -4666, daysRemaining: 4 }
      );
      expect(res).toContain('track');
    });
  });

  describe('generateWorkoutSuggestion', () => {
    it('returns recovery advice', async () => {
      const svc = await loadService();
      mockResponse({ response: 'Refuel with 25g of protein.' });
      const res = await svc.generateWorkoutSuggestion(
        { recentSessions: ['Running'], lastSession: 'Running', daysSinceLast: 0 },
        { burned: 300, protein: 80, proteinGoal: 150 }
      );
      expect(typeof res).toBe('string');
    });
  });

  describe('testConnection', () => {
    it('returns ok=true on successful response', async () => {
      const svc = await loadService();
      mockResponse({ models: [{ name: 'llama3.2' }] });
      const res = await svc.testConnection({ url: 'https://example.com', apiKey: 'k' });
      expect(res.ok).toBe(true);
      expect(res.models).toContain('llama3.2');
    });
    it('returns ok=false on HTTP error', async () => {
      const svc = await loadService();
      mockResponse({}, false, 401);
      const res = await svc.testConnection({ url: 'https://example.com', apiKey: 'bad' });
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/401/);
    });
    it('returns ok=false when missing url/key', async () => {
      const svc = await loadService();
      const res = await svc.testConnection({});
      expect(res.ok).toBe(false);
    });
  });
});
