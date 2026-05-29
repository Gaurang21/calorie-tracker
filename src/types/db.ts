// Database row types, derived from supabase/migrations/0001_initial_schema.sql
// and 0002_ai_features.sql. Hand-maintained — keep in sync with migrations.

export type UUID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISOTimestamp = string;

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type GoalPace =
  | 'lose_1kg'
  | 'lose_0_5kg'
  | 'maintain'
  | 'gain_0_5kg'
  | 'gain_1kg';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type FoodSource = 'manual' | 'barcode' | 'photo_ai' | 'template';

export type Units = 'metric' | 'imperial';

export type AISummaryKind = 'weekly' | 'pacing' | 'insight';

export interface AIFeatureFlags {
  weekly_summary?: boolean;
  ask_anything?: boolean;
  meal_suggestions?: boolean;
  food_swap?: boolean;
  daily_insights?: boolean;
  goal_pacing?: boolean;
  workout_suggestions?: boolean;
  [k: string]: boolean | undefined;
}

export interface Profile {
  id: UUID;
  name: string | null;
  sex: Sex | null;
  date_of_birth: ISODate | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  goal_weight_kg: number | null;
  goal_pace: GoalPace | null;
  units: Units;
  dark_mode: boolean;
  daily_calorie_override: number | null;
  macro_protein_pct: number;
  macro_carbs_pct: number;
  macro_fat_pct: number;
  water_target_ml: number;
  gemini_api_key: string | null;
  ollama_url: string | null;
  ollama_api_key: string | null;
  ai_features_enabled: AIFeatureFlags;
  onboarding_complete: boolean;
  created_at?: ISOTimestamp;
  updated_at?: ISOTimestamp;
}

export interface WeightLog {
  id: UUID;
  user_id: UUID;
  date: ISODate;
  weight_kg: number;
  notes?: string | null;
  created_at?: ISOTimestamp;
}

export interface FoodLog {
  id: UUID;
  user_id: UUID;
  date: ISODate;
  meal: Meal;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string | null;
  source?: FoodSource | null;
  created_at?: ISOTimestamp;
}

export interface ActivityLog {
  id: UUID;
  user_id: UUID;
  date: ISODate;
  activity_type: string;
  duration_mins: number | null;
  calories_burned: number;
  notes?: string | null;
  created_at?: ISOTimestamp;
}

export interface WaterLog {
  id: UUID;
  user_id: UUID;
  date: ISODate;
  amount_ml: number;
  updated_at?: ISOTimestamp;
}

export interface UserFood {
  id: UUID;
  user_id: UUID;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string | null;
  times_used: number;
  created_at?: ISOTimestamp;
}

export interface MealTemplateFood {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string | null;
}

export interface MealTemplate {
  id: UUID;
  user_id: UUID;
  name: string;
  foods: MealTemplateFood[];
  created_at?: ISOTimestamp;
}

export interface AISummary {
  id: UUID;
  user_id: UUID;
  week_start: ISODate;
  summary: string;
  kind: AISummaryKind;
  created_at?: ISOTimestamp;
}
