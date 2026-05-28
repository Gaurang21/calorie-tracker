import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
  vi.stubEnv('VITE_GROQ_URL', 'https://test-groq.example.com/v1');
  vi.stubEnv('VITE_GROQ_API_KEY', 'test-key');
  vi.stubEnv('VITE_E2E', '');
  vi.resetModules();
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

async function loadService() {
  return await import('./groqService.js');
}

function mockChat(content, ok = true, status = 200) {
  global.fetch.mockResolvedValueOnce({
    ok,
    status,
    json: async () => ok
      ? { choices: [{ message: { content } }] }
      : { error: { message: 'fail' } },
  });
}

describe('groqService', () => {
  it('parseNaturalLanguageFood returns items array', async () => {
    const svc = await loadService();
    mockChat(JSON.stringify({ items: [{ name: 'Toast', serving: '1 slice', calories: 80, protein_g: 3, carbs_g: 14, fat_g: 1 }] }));
    const res = await svc.parseNaturalLanguageFood('a slice of toast');
    expect(res.items).toHaveLength(1);
    expect(res.items[0].name).toBe('Toast');
  });

  it('uses Authorization Bearer header for Groq', async () => {
    const svc = await loadService();
    mockChat('hello');
    await svc.generateWeeklySummary({ daysLogged: 7, avgCalories: 2000, calorieGoal: 2000, daysHitGoal: 5, avgProtein: 130, proteinGoal: 150, weightChange: 0, activitySessions: 3, caloriesBurned: 900 });
    expect(global.fetch).toHaveBeenCalled();
    const [, init] = global.fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer test-key');
  });

  it('uses chat/completions endpoint', async () => {
    const svc = await loadService();
    mockChat('ok');
    await svc.generateDailyInsight(
      { caloriesEaten: 1500, caloriesBurned: 200, proteinEaten: 100, calorieGoal: 2000, proteinGoal: 150, timeOfDay: '18:00' },
      { summary: 'x', trigger: 'y' }
    );
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/chat\/completions$/);
  });

  it('passes response_format=json_object when expectJson is true', async () => {
    const svc = await loadService();
    mockChat(JSON.stringify({ suggestions: [
      { name: 'A', description: 'x', calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10 },
      { name: 'B', description: 'y', calories: 350, protein_g: 25, carbs_g: 35, fat_g: 12 },
      { name: 'C', description: 'z', calories: 400, protein_g: 30, carbs_g: 40, fat_g: 14 },
    ] }));
    await svc.suggestMeals(800, { protein: 50, carbs: 80, fat: 20 }, []);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('suggestFoodSwap returns 3 swaps with reason', async () => {
    const svc = await loadService();
    mockChat(JSON.stringify({ swaps: [
      { name: 'A', calories: 200, protein_g: 25, carbs_g: 5, fat_g: 8, reason: 'r1' },
      { name: 'B', calories: 210, protein_g: 22, carbs_g: 10, fat_g: 9, reason: 'r2' },
      { name: 'C', calories: 220, protein_g: 20, carbs_g: 15, fat_g: 10, reason: 'r3' },
    ] }));
    const res = await svc.suggestFoodSwap({ name: 'pizza', calories: 250, protein_g: 10 }, { protein: 30, carbs: 0, fat: 0 });
    expect(res.swaps).toHaveLength(3);
    expect(res.swaps[0]).toHaveProperty('reason');
  });

  it('throws on invalid JSON', async () => {
    const svc = await loadService();
    mockChat('not json');
    await expect(svc.parseNaturalLanguageFood('x')).rejects.toThrow(/invalid JSON/);
  });

  it('throws on non-OK response', async () => {
    const svc = await loadService();
    mockChat('', false, 401);
    await expect(svc.generateWeeklySummary({})).rejects.toThrow(/401/);
  });

  describe('testConnection', () => {
    it('returns ok=true and models list', async () => {
      const svc = await loadService();
      global.fetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ data: [{ id: 'llama-3.1-8b-instant' }, { id: 'llama-3.3-70b-versatile' }] }),
      });
      const res = await svc.testConnection({ url: 'https://api.groq.com/openai/v1', apiKey: 'k' });
      expect(res.ok).toBe(true);
      expect(res.models).toContain('llama-3.1-8b-instant');
    });
    it('returns ok=false on HTTP error', async () => {
      const svc = await loadService();
      global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
      const res = await svc.testConnection({ url: 'https://x', apiKey: 'bad' });
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/401/);
    });
    it('returns ok=false when key missing', async () => {
      const svc = await loadService();
      const res = await svc.testConnection({});
      expect(res.ok).toBe(false);
    });
  });
});
