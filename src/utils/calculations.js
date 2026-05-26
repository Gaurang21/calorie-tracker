// Health & nutrition calculation utilities.
// All inputs in metric (kg, cm); convert at the boundary.

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const GOAL_PACE_DELTA = {
  lose_1kg: -1100,
  lose_0_5kg: -550,
  maintain: 0,
  gain_0_5kg: 550,
  gain_1kg: 1100,
};

export const MET_VALUES = {
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  swimming: 8.0,
  weight_training: 5.0,
  hiit: 10.0,
  yoga: 2.5,
};

export function ageFromDob(dob, today = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

// Mifflin-St Jeor
export function bmr({ sex, weightKg, heightCm, age }) {
  if (!sex || !weightKg || !heightCm || age == null) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function tdee({ bmr: bmrValue, activityLevel }) {
  if (!bmrValue || !activityLevel) return null;
  const mult = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!mult) return null;
  return Math.round(bmrValue * mult);
}

export function bmi({ weightKg, heightCm }) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiCategory(value) {
  if (value == null) return null;
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Overweight';
  return 'Obese';
}

export function goalCalorieTarget({ tdee: tdeeValue, goalPace }) {
  if (!tdeeValue || !goalPace) return null;
  const delta = GOAL_PACE_DELTA[goalPace] ?? 0;
  return Math.max(1200, Math.round(tdeeValue + delta));
}

// MET formula: kcal = MET * weight(kg) * hours
export function metCalories({ met, weightKg, durationMins }) {
  if (!met || !weightKg || !durationMins) return 0;
  return Math.round(met * weightKg * (durationMins / 60));
}

// US Navy method body fat %
export function bodyFatNavy({ sex, heightCm, waistCm, neckCm, hipCm }) {
  if (!sex || !heightCm || !waistCm || !neckCm) return null;
  if (sex === 'female' && !hipCm) return null;
  const log10 = (x) => Math.log10(x);
  let bf;
  if (sex === 'male') {
    bf = 495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450;
  } else {
    bf = 495 / (1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.221 * log10(heightCm)) - 450;
  }
  return +bf.toFixed(1);
}

export function macroTargets({ calorieTarget, proteinPct = 30, carbsPct = 40, fatPct = 30 }) {
  if (!calorieTarget) return { protein_g: 0, carbs_g: 0, fat_g: 0 };
  return {
    protein_g: Math.round((calorieTarget * (proteinPct / 100)) / 4),
    carbs_g: Math.round((calorieTarget * (carbsPct / 100)) / 4),
    fat_g: Math.round((calorieTarget * (fatPct / 100)) / 9),
  };
}

export function kgToLb(kg) {
  return +(kg * 2.20462).toFixed(1);
}
export function lbToKg(lb) {
  return +(lb / 2.20462).toFixed(1);
}
export function cmToIn(cm) {
  return +(cm / 2.54).toFixed(1);
}
export function inToCm(inch) {
  return +(inch * 2.54).toFixed(1);
}
export function mlToFlOz(ml) {
  return +(ml / 29.5735).toFixed(1);
}
export function flOzToMl(oz) {
  return Math.round(oz * 29.5735);
}
