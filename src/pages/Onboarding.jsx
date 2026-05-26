import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

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
  const [data, setData] = useState({
    name: profile?.name || '',
    sex: profile?.sex || '',
    date_of_birth: profile?.date_of_birth || '',
    height_cm: profile?.height_cm || '',
    weight_kg: '',
    units: profile?.units || 'metric',
    activity_level: profile?.activity_level || '',
    goal_weight_kg: profile?.goal_weight_kg || '',
    goal_pace: profile?.goal_pace || 'maintain',
  });

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  const canNext = () => {
    if (step === 1) return data.name && data.sex && data.date_of_birth;
    if (step === 2) return data.height_cm && data.weight_kg && data.units;
    if (step === 3) return data.activity_level;
    if (step === 4) return data.goal_weight_kg && data.goal_pace;
    return false;
  };

  const finish = async () => {
    await update({
      name: data.name,
      sex: data.sex,
      date_of_birth: data.date_of_birth,
      height_cm: Number(data.height_cm),
      units: data.units,
      activity_level: data.activity_level,
      goal_weight_kg: Number(data.goal_weight_kg),
      goal_pace: data.goal_pace,
      onboarding_complete: true,
    });
    if (user && data.weight_kg) {
      const today = new Date().toISOString().slice(0, 10);
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
      <div className="w-full max-w-md card p-6">
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
              <label className="label" htmlFor="ob-name">Name</label>
              <input id="ob-name" className="input" value={data.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label">Sex</label>
              <div className="grid grid-cols-2 gap-2">
                {['male', 'female'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, sex: s }))}
                    className={`btn ${data.sex === s ? 'bg-brand-500 text-white' : 'btn-secondary'}`}
                  >
                    {s === 'male' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="ob-dob">Date of birth</label>
              <input id="ob-dob" type="date" className="input" value={data.date_of_birth} onChange={set('date_of_birth')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Body metrics</h2>
            <div>
              <label className="label">Units</label>
              <div className="grid grid-cols-2 gap-2">
                {['metric', 'imperial'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, units: u }))}
                    className={`btn ${data.units === u ? 'bg-brand-500 text-white' : 'btn-secondary'}`}
                  >
                    {u === 'metric' ? 'Metric (kg / cm)' : 'Imperial (lb / in)'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="ob-height">Height (cm)</label>
              <input id="ob-height" type="number" className="input" value={data.height_cm} onChange={set('height_cm')} />
            </div>
            <div>
              <label className="label" htmlFor="ob-weight">Current weight (kg)</label>
              <input id="ob-weight" type="number" step="0.1" className="input" value={data.weight_kg} onChange={set('weight_kg')} />
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
                onClick={() => setData((d) => ({ ...d, activity_level: o.value }))}
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
              <label className="label" htmlFor="ob-target-weight">Target weight (kg)</label>
              <input id="ob-target-weight" type="number" step="0.1" className="input" value={data.goal_weight_kg} onChange={set('goal_weight_kg')} />
            </div>
            <div>
              <label className="label">Pace</label>
              <div className="space-y-2">
                {PACE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, goal_pace: o.value }))}
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
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="btn-secondary"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button type="button" disabled={!canNext()} onClick={finish} className="btn-primary">
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
