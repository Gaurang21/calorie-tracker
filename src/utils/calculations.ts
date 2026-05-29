// Health & nutrition calculation utilities.
// All inputs in metric (kg, cm); convert at the boundary.

import type { Sex, ActivityLevel, GoalPace } from '../types/db';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const GOAL_PACE_DELTA: Record<GoalPace, number> = {
  lose_1kg: -1100,
  lose_0_5kg: -550,
  maintain: 0,
  gain_0_5kg: 550,
  gain_1kg: 1100,
};

export type MetActivity =
  | 'running' | 'walking' | 'cycling' | 'swimming'
  | 'weight_training' | 'hiit' | 'yoga';

export const MET_VALUES: Record<MetActivity, number> = {
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  swimming: 8.0,
  weight_training: 5.0,
  hiit: 10.0,
  yoga: 2.5,
};

export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export function ageFromDob(dob: string | null | undefined, today: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

// Mifflin-St Jeor
export interface BmrInput {
  sex?: Sex | null;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
}
export function bmr({ sex, weightKg, heightCm, age }: BmrInput): number | null {
  if (!sex || !weightKg || !heightCm || age == null) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export interface TdeeInput {
  bmr?: number | null;
  activityLevel?: ActivityLevel | null;
}
export function tdee({ bmr: bmrValue, activityLevel }: TdeeInput): number | null {
  if (!bmrValue || !activityLevel) return null;
  const mult = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!mult) return null;
  return Math.round(bmrValue * mult);
}

export interface BmiInput {
  weightKg?: number | null;
  heightCm?: number | null;
}
export function bmi({ weightKg, heightCm }: BmiInput): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiCategory(value: number | null | undefined): BmiCategory | null {
  if (value == null) return null;
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Overweight';
  return 'Obese';
}

export interface GoalCalorieInput {
  tdee?: number | null;
  goalPace?: GoalPace | null;
}
export function goalCalorieTarget({ tdee: tdeeValue, goalPace }: GoalCalorieInput): number | null {
  if (!tdeeValue || !goalPace) return null;
  const delta = GOAL_PACE_DELTA[goalPace] ?? 0;
  return Math.max(1200, Math.round(tdeeValue + delta));
}

// MET formula: kcal = MET * weight(kg) * hours
export interface MetCaloriesInput {
  met?: number | null;
  weightKg?: number | null;
  durationMins?: number | null;
}
export function metCalories({ met, weightKg, durationMins }: MetCaloriesInput): number {
  if (!met || !weightKg || !durationMins) return 0;
  return Math.round(met * weightKg * (durationMins / 60));
}

// US Navy method body fat %
export interface BodyFatInput {
  sex?: Sex | null;
  heightCm?: number | null;
  waistCm?: number | null;
  neckCm?: number | null;
  hipCm?: number | null;
}
export function bodyFatNavy({ sex, heightCm, waistCm, neckCm, hipCm }: BodyFatInput): number | null {
  if (!sex || !heightCm || !waistCm || !neckCm) return null;
  if (sex === 'female' && !hipCm) return null;
  const log10 = (x: number): number => Math.log10(x);
  let bf: number;
  if (sex === 'male') {
    bf = 495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450;
  } else {
    bf = 495 / (1.29579 - 0.35004 * log10(waistCm + (hipCm as number) - neckCm) + 0.221 * log10(heightCm)) - 450;
  }
  return +bf.toFixed(1);
}

export interface MacroTargetsInput {
  calorieTarget?: number | null;
  proteinPct?: number;
  carbsPct?: number;
  fatPct?: number;
}
export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
export function macroTargets({ calorieTarget, proteinPct = 30, carbsPct = 40, fatPct = 30 }: MacroTargetsInput): MacroTargets {
  if (!calorieTarget) return { protein_g: 0, carbs_g: 0, fat_g: 0 };
  return {
    protein_g: Math.round((calorieTarget * (proteinPct / 100)) / 4),
    carbs_g: Math.round((calorieTarget * (carbsPct / 100)) / 4),
    fat_g: Math.round((calorieTarget * (fatPct / 100)) / 9),
  };
}

export function kgToLb(kg: number): number {
  return +(kg * 2.20462).toFixed(1);
}
export function lbToKg(lb: number): number {
  return +(lb / 2.20462).toFixed(1);
}
export function cmToIn(cm: number): number {
  return +(cm / 2.54).toFixed(1);
}
export function inToCm(inch: number): number {
  return +(inch * 2.54).toFixed(1);
}
export function mlToFlOz(ml: number): number {
  return +(ml / 29.5735).toFixed(1);
}
export function flOzToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}
