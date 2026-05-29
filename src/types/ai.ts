// Shared types for AI service responses + feature inputs.

export interface ParsedFoodItem {
  name: string;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ParseFoodResult {
  items: ParsedFoodItem[];
}

export interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealSuggestionResult {
  suggestions: MealSuggestion[];
}

export interface FoodSwap {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  reason: string;
}

export interface FoodSwapResult {
  swaps: FoodSwap[];
}

export interface WeekData {
  daysLogged: number;
  avgCalories: number;
  calorieGoal: number;
  daysHitGoal: number;
  avgProtein: number;
  proteinGoal: number;
  weightChange: number;
  activitySessions: number;
  caloriesBurned: number;
}

export interface MacroGaps {
  protein: number;
  carbs: number;
  fat: number;
}

export interface TodayData {
  caloriesEaten: number;
  caloriesBurned: number;
  proteinEaten: number;
  calorieGoal: number;
  proteinGoal: number;
  timeOfDay: string;
}

export interface RecentHistory {
  summary: string;
  trigger: string;
}

export interface PacingGoalData {
  pace: string;
  weeklyCalorieTarget: number;
}

export interface PacingProgress {
  currentDeficit: number;
  daysElapsed: number;
  projectedWeeklyDeficit: number;
  daysRemaining: number;
}

export interface ActivityLogContext {
  recentSessions: string[];
  lastSession: string | null;
  daysSinceLast: number;
}

export interface CalorieDataContext {
  burned: number;
  protein: number;
  proteinGoal: number;
}

export interface TestConnectionResult {
  ok: boolean;
  models?: string[];
  error?: string | null;
}
