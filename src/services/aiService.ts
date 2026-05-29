// Provider-agnostic AI service. All AI-feature components import from here.
// Pick a provider with VITE_AI_PROVIDER=groq|ollama (default: ollama).
//
// Both providers expose the same 8 feature functions + testConnection.

import * as ollama from './ollamaService';
import * as groq from './groqService';

type Provider = 'ollama' | 'groq';

const PROVIDER = ((import.meta.env.VITE_AI_PROVIDER || 'ollama').toLowerCase()) as Provider;
const active = PROVIDER === 'groq' ? groq : ollama;

export const provider: Provider = PROVIDER;
export const providerLabel: string = PROVIDER === 'groq' ? 'Groq' : 'Ollama';

export const testConnection = active.testConnection;
export const parseNaturalLanguageFood = active.parseNaturalLanguageFood;
export const generateWeeklySummary = active.generateWeeklySummary;
export const answerDataQuestion = active.answerDataQuestion;
export const suggestMeals = active.suggestMeals;
export const suggestFoodSwap = active.suggestFoodSwap;
export const generateDailyInsight = active.generateDailyInsight;
export const generateGoalPacingMessage = active.generateGoalPacingMessage;
export const generateWorkoutSuggestion = active.generateWorkoutSuggestion;
