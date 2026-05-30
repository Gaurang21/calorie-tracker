import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { todayLocalISO } from '../utils/date';
import type { Sex, ActivityLevel, GoalPace, Units } from '../types/db';

interface OnboardingData {
  name: string;
  sex: Sex | '';
  date_of_birth: string;
  height_cm: number | string;
  weight_kg: number | string;
  units: Units;
  activity_level: ActivityLevel | '';
  goal_weight_kg: number | string;
  goal_pace: GoalPace;
}

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Lightly active', desc: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately active', desc: 'Moderate exercise 3–5 days/week' },
  { value: 'very_active', label: 'Very active', desc: 'Hard exercise 6–7 days/week' },
  { value: 'extra_active', label: 'Extra active', desc: 'Very hard exercise & physical job' },
];

const PACE_OPTIONS = [
  { value: 'lose_1kg', label: 'Lose 1 kg / week' },
  { value: 'lose_0_5kg', label: 'Lose 0.5 kg / week' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain_0_5kg', label: 'Gain 0.5 kg / week' },
  { value: 'gain_1kg', label: 'Gain 1 kg / week' },
];

export default function Onboarding() {
  const { profile, update } = useProfile();
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: profile?.name || '',
    sex: (profile?.sex as Sex | '') || '',
    date_of_birth: profile?.date_of_birth || '',
    height_cm: profile?.height_cm || '',
    weight_kg: '',
    units: profile?.units || 'metric',
    activity_level: (profile?.activity_level as ActivityLevel | '') || '',
    goal_weight_kg: profile?.goal_weight_kg || '',
    goal_pace: (profile?.goal_pace as GoalPace) || 'maintain',
  });

  const set = (k: keyof OnboardingData) => (e: ChangeEvent<HTMLInputElement>) => setData((d) => ({ ...d, [k]: e.target.value }));

  const canNext = (): boolean => {
    if (step === 1) return !!(data.name && data.sex && data.date_of_birth);
    if (step === 2) return !!(data.height_cm && data.weight_kg && data.units);
    if (step === 3) return !!data.activity_level;
    if (step === 4) return !!(data.goal_weight_kg && data.goal_pace);
    return false;
  };

  const finish = async (): Promise<void> => {
    await update({
      name: data.name,
      sex: data.sex as Sex,
      date_of_birth: data.date_of_birth,
      height_cm: Number(data.height_cm),
      units: data.units,
      activity_level: data.activity_level as ActivityLevel,
      goal_weight_kg: Number(data.goal_weight_kg),
      goal_pace: data.goal_pace,
      onboarding_complete: true,
    });
    if (user && data.weight_kg) {
      const today = todayLocalISO();
      await supabase.from('weight_log').upsert({
        user_id: user.id,
        date: today,
        weight_kg: Number(data.weight_kg),
      }, { onConflict: 'user_id,date' });
    }
    nav('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Step {step} of 4</div>
          <div className="h-1.5 mt-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Tell us about yourself</h2>
            <div>
              <Label htmlFor="ob-name">Name</Label>
              <Input id="ob-name" value={data.name} onChange={set('name')} />
            </div>
            <div>
              <Label>Sex</Label>
              <div className="grid grid-cols-2 gap-2">
                {['male', 'female'].map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={data.sex === s ? 'default' : 'secondary'}
                    onClick={() => setData((d) => ({ ...d, sex: s as Sex }))}
                  >
                    {s === 'male' ? 'Male' : 'Female'}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="ob-dob">Date of birth</Label>
              <Input id="ob-dob" type="date" value={data.date_of_birth} onChange={set('date_of_birth')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Body metrics</h2>
            <div>
              <Label>Units</Label>
              <div className="grid grid-cols-2 gap-2">
                {['metric', 'imperial'].map((u) => (
                  <Button
                    key={u}
                    type="button"
                    variant={data.units === u ? 'default' : 'secondary'}
                    onClick={() => setData((d) => ({ ...d, units: u as Units }))}
                  >
                    {u === 'metric' ? 'Metric (kg / cm)' : 'Imperial (lb / in)'}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="ob-height">Height (cm)</Label>
              <Input id="ob-height" type="number" value={data.height_cm} onChange={set('height_cm')} />
            </div>
            <div>
              <Label htmlFor="ob-weight">Current weight (kg)</Label>
              <Input id="ob-weight" type="number" step="0.1" value={data.weight_kg} onChange={set('weight_kg')} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Activity level</h2>
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setData((d) => ({ ...d, activity_level: o.value as ActivityLevel }))}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  data.activity_level === o.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : ''
                }`}
                style={{ borderColor: data.activity_level === o.value ? 'var(--brand)' : 'var(--border)' }}
              >
                <div className="font-medium">{o.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Your goal</h2>
            <div>
              <Label htmlFor="ob-target-weight">Target weight (kg)</Label>
              <Input id="ob-target-weight" type="number" step="0.1" value={data.goal_weight_kg} onChange={set('goal_weight_kg')} />
            </div>
            <div>
              <Label>Pace</Label>
              <div className="space-y-2">
                {PACE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, goal_pace: o.value as GoalPace }))}
                    className={`w-full text-left p-2.5 rounded-xl border transition ${
                      data.goal_pace === o.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : ''
                    }`}
                    style={{ borderColor: data.goal_pace === o.value ? 'var(--brand)' : 'var(--border)' }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button type="button" disabled={!canNext()} onClick={finish}>
              Finish
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
