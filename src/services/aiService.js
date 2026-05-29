// Provider-agnostic AI service. All AI-feature components import from here.
// Pick a provider with VITE_AI_PROVIDER=groq|ollama (default: ollama).
//
// To switch:
//   VITE_AI_PROVIDER=groq   → uses src/services/groqService.js
//   VITE_AI_PROVIDER=ollama → uses src/services/ollamaService.js
//
// Both providers expose the same 8 feature functions + testConnection.

import * as ollama from './ollamaService.js';
import * as groq from './groqService.js';

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER || 'ollama').toLowerCase();
const active = PROVIDER === 'groq' ? groq : ollama;

export const provider = PROVIDER;
export const providerLabel = PROVIDER === 'groq' ? 'Groq' : 'Ollama';

export const testConnection = active.testConnection;
export const parseNaturalLanguageFood = active.parseNaturalLanguageFood;
export const generateWeeklySummary = active.generateWeeklySummary;
export const answerDataQuestion = active.answerDataQuestion;
export const suggestMeals = active.suggestMeals;
export const suggestFoodSwap = active.suggestFoodSwap;
export const generateDailyInsight = active.generateDailyInsight;
export const generateGoalPacingMessage = active.generateGoalPacingMessage;
export const generateWorkoutSuggestion = active.generateWorkoutSuggestion;
