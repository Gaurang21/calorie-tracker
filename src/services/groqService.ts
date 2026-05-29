// Groq backend — same exported function signatures as ollamaService.ts.
// Uses Groq's OpenAI-compatible chat completions API.
// Switch between providers with VITE_AI_PROVIDER=groq|ollama.

import type {
  ParseFoodResult,
  MealSuggestionResult,
  FoodSwapResult,
  WeekData,
  MacroGaps,
  TodayData,
  RecentHistory,
  PacingGoalData,
  PacingProgress,
  ActivityLogContext,
  CalorieDataContext,
  TestConnectionResult,
} from '../types/ai';

const GROQ_URL = import.meta.env.VITE_GROQ_URL || 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant';
const IS_E2E = import.meta.env.VITE_E2E === '1';

interface E2EMocks {
  parseNaturalLanguageFood: ParseFoodResult;
  generateWeeklySummary: string;
  answerDataQuestion: string;
  suggestMeals: MealSuggestionResult;
  suggestFoodSwap: FoodSwapResult;
  generateDailyInsight: string;
  generateGoalPacingMessage: string;
  generateWorkoutSuggestion: string;
}

// Per-feature stub responses for E2E (Playwright). Identical to ollamaService so tests pass with either provider.
const E2E_MOCKS: E2EMocks = {
  parseNaturalLanguageFood: {
    items: [
      { name: 'Oatmeal with banana', serving: '1 bowl', calories: 320, protein_g: 9, carbs_g: 56, fat_g: 6 },
      { name: 'Coffee with oat milk', serving: '1 cup', calories: 70, protein_g: 1, carbs_g: 8, fat_g: 3 },
    ],
  },
  generateWeeklySummary: 'Great week! You logged 6 of 7 days, averaged 1,920 cal and hit your protein goal 5 times. Try adding one extra protein serving at breakfast to make next week even stronger.',
  answerDataQuestion: 'Based on your last 30 days you averaged 1,940 calories per day with an average protein intake of 132g. You hit your calorie goal on 18 of those days.',
  suggestMeals: {
    suggestions: [
      { name: 'Grilled chicken & rice bowl', description: 'Lean protein with veg', calories: 520, protein_g: 42, carbs_g: 55, fat_g: 10 },
      { name: 'Greek yogurt with berries', description: 'High-protein snack', calories: 220, protein_g: 18, carbs_g: 24, fat_g: 4 },
      { name: 'Tuna salad wrap', description: 'Balanced lunch', calories: 410, protein_g: 30, carbs_g: 38, fat_g: 14 },
    ],
  },
  suggestFoodSwap: {
    swaps: [
      { name: 'Grilled chicken breast', calories: 210, protein_g: 32, carbs_g: 0, fat_g: 8, reason: 'Same calories but more than 3× the protein.' },
      { name: 'Salmon fillet', calories: 230, protein_g: 25, carbs_g: 0, fat_g: 14, reason: 'Similar calories with omega-3 fats.' },
      { name: 'Tofu stir-fry', calories: 200, protein_g: 18, carbs_g: 14, fat_g: 9, reason: 'Plant-based protein boost.' },
    ],
  },
  generateDailyInsight: "You're 80% of the way to your protein goal — a Greek yogurt would close the gap nicely.",
  generateGoalPacingMessage: "You're slightly under pace this week. A 20-minute walk today should put you right on track.",
  generateWorkoutSuggestion: 'Nice session — refuel with 25g of protein in the next hour to support recovery.',
};

interface GroqCallOpts { apiKey?: string | null; url?: string | null; model?: string }
interface GroqChatMessage { role: 'system' | 'user'; content: string }
interface GroqChatResponse { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
interface GroqModelsResponse { data?: Array<{ id: string }> }

async function callGroq(prompt: string, systemPrompt: string, expectJson: false, opts?: GroqCallOpts): Promise<string>;
async function callGroq(prompt: string, systemPrompt: string, expectJson: true, opts?: GroqCallOpts): Promise<unknown>;
async function callGroq(prompt: string, systemPrompt: string = '', expectJson: boolean = false, opts: GroqCallOpts = {}): Promise<string | unknown> {
  const apiKey = opts.apiKey || GROQ_API_KEY;
  const url = opts.url || GROQ_URL;

  if (!url || !apiKey || apiKey.includes('placeholder')) {
    throw new Error('Groq not configured — set VITE_GROQ_API_KEY');
  }

  const messages: GroqChatMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const body = {
    model: opts.model || MODEL,
    messages,
    temperature: 0.7,
    ...(expectJson && { response_format: { type: 'json_object' } }),
  };

  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = '';
    try { detail = ((await response.json()) as GroqChatResponse).error?.message || ''; } catch { /* ignore */ }
    throw new Error(`Groq request failed: ${response.status}${detail ? ` — ${detail}` : ''}`);
  }

  const data = await response.json() as GroqChatResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';

  if (expectJson) {
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Groq returned invalid JSON');
    }
  }
  return text;
}

export interface ConnectionOpts { url?: string | null; apiKey?: string | null }
export async function testConnection({ url, apiKey }: ConnectionOpts = {}): Promise<TestConnectionResult> {
  const target = url || GROQ_URL;
  const key = apiKey || GROQ_API_KEY;
  if (!target || !key || (typeof key === 'string' && key.includes('placeholder'))) {
    return { ok: false, error: 'Groq API key missing' };
  }
  try {
    const res = await fetch(`${target}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return { ok: false, error: `Server returned ${res.status}` };
    const data = await res.json() as GroqModelsResponse;
    const models = (data.data || []).map((m) => m.id);
    return { ok: true, models };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Feature functions (identical signatures to ollamaService.js) ────────────

export async function parseNaturalLanguageFood(userInput: string): Promise<ParseFoodResult> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.parseNaturalLanguageFood; }
  const system = `You are a nutrition expert. Parse food descriptions into structured data.
Always respond with valid JSON only. Estimate calories and macros based on typical serving sizes.
If quantity is unclear, assume a standard single serving.`;
  const prompt = `Parse this food description into individual items with nutrition estimates:
"${userInput}"

Respond with this exact JSON structure:
{
  "items": [
    { "name": "food name", "serving": "estimated serving size", "calories": 000, "protein_g": 00, "carbs_g": 00, "fat_g": 00 }
  ]
}`;
  return callGroq(prompt, system, true) as Promise<ParseFoodResult>;
}

export async function generateWeeklySummary(weekData: WeekData): Promise<string> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.generateWeeklySummary; }
  const system = `You are a supportive, friendly health coach.
Write concise, encouraging weekly summaries. Be specific with numbers.
Keep it to 3-5 sentences. Never be preachy or judgmental.`;
  const prompt = `Write a weekly health summary based on this data:

Days logged: ${weekData.daysLogged}/7
Average daily calories: ${weekData.avgCalories} (goal: ${weekData.calorieGoal})
Goal hit: ${weekData.daysHitGoal}/7 days
Average protein: ${weekData.avgProtein}g (goal: ${weekData.proteinGoal}g)
Weight change: ${weekData.weightChange}kg
Total activity sessions: ${weekData.activitySessions}
Total calories burned: ${weekData.caloriesBurned}

Write a warm, specific 3-5 sentence summary highlighting wins and one actionable suggestion.`;
  return callGroq(prompt, system, false);
}

export async function answerDataQuestion(question: string, contextData: unknown): Promise<string> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.answerDataQuestion; }
  const system = `You are a personal health assistant with access to the user's fitness data.
Answer questions concisely and accurately using only the data provided.
If the data doesn't contain enough information to answer, say so clearly.
Never make up data. Use specific numbers from the context.`;
  const prompt = `User's health data context:
${JSON.stringify(contextData, null, 2)}

User question: "${question}"

Answer concisely in 1-3 sentences using the data above.`;
  return callGroq(prompt, system, false);
}

export async function suggestMeals(remainingCalories: number, macroGaps: MacroGaps, recentFoods: string[]): Promise<MealSuggestionResult> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.suggestMeals; }
  const system = `You are a nutrition expert. Suggest practical, realistic meals.
Always respond with valid JSON only.`;
  const prompt = `Suggest 3 meals based on these nutritional needs:

Remaining calories today: ${remainingCalories}
Protein still needed: ${macroGaps.protein}g
Carbs still needed: ${macroGaps.carbs}g
Fat still needed: ${macroGaps.fat}g
Recently logged foods (avoid repetition): ${(recentFoods || []).join(', ')}

Return JSON:
{
  "suggestions": [
    { "name": "meal name", "description": "brief description", "calories": 000, "protein_g": 00, "carbs_g": 00, "fat_g": 00 }
  ]
}`;
  return callGroq(prompt, system, true) as Promise<MealSuggestionResult>;
}

interface LoggedFoodLike { name: string; calories: number; protein_g: number }
export async function suggestFoodSwap(loggedFood: LoggedFoodLike, macroGaps: MacroGaps): Promise<FoodSwapResult> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.suggestFoodSwap; }
  const system = `You are a nutrition expert. Suggest realistic food swaps.
Always respond with valid JSON only.`;
  const prompt = `Suggest 3 alternative foods to swap for "${loggedFood.name}" (${loggedFood.calories} cal, ${loggedFood.protein_g}g protein).

Current macro gaps for today: protein ${macroGaps.protein}g, carbs ${macroGaps.carbs}g, fat ${macroGaps.fat}g

Prioritize swaps that better fill the macro gaps while keeping similar calories.

Return JSON:
{
  "swaps": [
    { "name": "food name", "calories": 000, "protein_g": 00, "carbs_g": 00, "fat_g": 00, "reason": "one sentence why this is a good swap" }
  ]
}`;
  return callGroq(prompt, system, true) as Promise<FoodSwapResult>;
}

export async function generateDailyInsight(todayData: TodayData, recentHistory: RecentHistory): Promise<string> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.generateDailyInsight; }
  const system = `You are a supportive health coach. Write brief, specific, actionable insights.
One sentence only. Never preachy. Be warm and encouraging.`;
  const prompt = `Generate one brief insight for this user:

Today so far: ${todayData.caloriesEaten} cal eaten, ${todayData.caloriesBurned} burned, ${todayData.proteinEaten}g protein
Goal: ${todayData.calorieGoal} cal, ${todayData.proteinGoal}g protein
Time of day: ${todayData.timeOfDay}
Recent pattern: ${recentHistory.summary}
Trigger: ${recentHistory.trigger}

Write exactly one encouraging, specific sentence.`;
  return callGroq(prompt, system, false);
}

export async function generateGoalPacingMessage(goalData: PacingGoalData, weeklyProgress: PacingProgress): Promise<string> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.generateGoalPacingMessage; }
  const system = `You are a supportive fitness coach. Be concise, specific, and encouraging.
Maximum 2 sentences.`;
  const prompt = `Goal: ${goalData.pace} (${goalData.weeklyCalorieTarget} cal/week deficit)
This week so far: ${weeklyProgress.currentDeficit} cal deficit over ${weeklyProgress.daysElapsed} days
On track for: ${weeklyProgress.projectedWeeklyDeficit} cal deficit this week
Days remaining in week: ${weeklyProgress.daysRemaining}

Write 1-2 sentences on whether they're on track and what to do today.`;
  return callGroq(prompt, system, false);
}

export async function generateWorkoutSuggestion(activityLog: ActivityLogContext, calorieData: CalorieDataContext): Promise<string> {
  if (IS_E2E) { await new Promise((r) => setTimeout(r, 300)); return E2E_MOCKS.generateWorkoutSuggestion; }
  const system = `You are a fitness and recovery expert. Give brief, practical advice.
Maximum 2 sentences. Be encouraging, never guilt-inducing.`;
  const prompt = `Recent activity: ${(activityLog.recentSessions || []).join(', ') || 'none in last 3 days'}
Last session: ${activityLog.lastSession || 'none'}
Calories burned today: ${calorieData.burned}
Protein intake today: ${calorieData.protein}g (goal: ${calorieData.proteinGoal}g)
Days since last activity: ${activityLog.daysSinceLast}

Write 1-2 sentences of specific recovery or motivation advice.`;
  return callGroq(prompt, system, false);
}
