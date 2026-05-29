import { describe, it, expect } from 'vitest';
import {
  bmr,
  tdee,
  bmi,
  bmiCategory,
  goalCalorieTarget,
  metCalories,
  bodyFatNavy,
  ACTIVITY_MULTIPLIERS,
  ageFromDob,
  macroTargets,
} from './calculations';

describe('bmr (Mifflin-St Jeor)', () => {
  it('computes male BMR', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(bmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 })).toBe(1780);
  });
  it('computes female BMR', () => {
    // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25 -> 1380
    expect(bmr({ sex: 'female', weightKg: 65, heightCm: 165, age: 28 })).toBe(1380);
  });
  it('returns null on missing inputs', () => {
    expect(bmr({ sex: 'male', weightKg: 80, heightCm: 180 })).toBeNull();
  });
});

describe('tdee', () => {
  const base = 1780;
  it.each(Object.entries(ACTIVITY_MULTIPLIERS))(
    'applies %s multiplier',
    (level, mult) => {
      expect(tdee({ bmr: base, activityLevel: level as any })).toBe(Math.round(base * mult));
    }
  );
  it('returns null on missing activity', () => {
    expect(tdee({ bmr: base })).toBeNull();
  });
});

describe('bmi', () => {
  it('computes value', () => {
    expect(bmi({ weightKg: 70, heightCm: 175 })).toBeCloseTo(22.9, 1);
  });
  it.each([
    [17, 'Underweight'],
    [22, 'Normal'],
    [27, 'Overweight'],
    [32, 'Obese'],
  ])('labels %s -> %s', (v, label) => {
    expect(bmiCategory(v)).toBe(label);
  });
});

describe('goalCalorieTarget', () => {
  it.each([
    ['lose_1kg', -1100],
    ['lose_0_5kg', -550],
    ['maintain', 0],
    ['gain_0_5kg', 550],
    ['gain_1kg', 1100],
  ])('applies %s delta', (pace, delta) => {
    expect(goalCalorieTarget({ tdee: 2500, goalPace: pace as any })).toBe(2500 + delta);
  });
  it('enforces minimum floor of 1200', () => {
    expect(goalCalorieTarget({ tdee: 1500, goalPace: 'lose_1kg' })).toBe(1200);
  });
});

describe('metCalories', () => {
  it('applies MET formula', () => {
    // 9.8 * 80 * (30/60) = 392
    expect(metCalories({ met: 9.8, weightKg: 80, durationMins: 30 })).toBe(392);
  });
  it('returns 0 for missing inputs', () => {
    expect(metCalories({ met: 9.8, durationMins: 30 })).toBe(0);
  });
});

describe('bodyFatNavy', () => {
  it('computes male value', () => {
    const v = bodyFatNavy({ sex: 'male', heightCm: 180, waistCm: 85, neckCm: 38 });
    expect(typeof v).toBe('number');
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(40);
  });
  it('computes female value', () => {
    const v = bodyFatNavy({ sex: 'female', heightCm: 165, waistCm: 75, neckCm: 33, hipCm: 95 });
    expect(typeof v).toBe('number');
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(50);
  });
  it('requires hip for female', () => {
    expect(bodyFatNavy({ sex: 'female', heightCm: 165, waistCm: 75, neckCm: 33 })).toBeNull();
  });
});

describe('ageFromDob', () => {
  it('computes age', () => {
    expect(ageFromDob('1990-01-01', new Date('2025-06-01'))).toBe(35);
  });
  it('handles birthday not yet reached', () => {
    expect(ageFromDob('1990-12-31', new Date('2025-06-01'))).toBe(34);
  });
});

describe('macroTargets', () => {
  it('splits calories by macro pct', () => {
    const m = macroTargets({ calorieTarget: 2000 });
    expect(m.protein_g).toBe(150); // 30% / 4
    expect(m.carbs_g).toBe(200);   // 40% / 4
    expect(m.fat_g).toBe(67);      // 30% / 9
  });
});
