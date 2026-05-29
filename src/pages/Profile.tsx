import { useEffect, useState, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useDailyTargets } from '../hooks/useDailyTargets';
import { bmi, bmiCategory, bodyFatNavy } from '../utils/calculations';
import { parseAppleHealthExport } from '../utils/appleHealthParser';
import type { Profile as ProfileType, Sex, ActivityLevel, GoalPace, WeightLog } from '../types/db';
import type { ReactNode } from 'react';

interface NavyInputs { waistCm: string; neckCm: string; hipCm: string }

export default function Profile() {
  const { user } = useAuth();
  const { profile, update } = useProfile();
  const { bmr, tdee, calorieTarget, currentWeightKg, age } = useDailyTargets(profile);
  const [draft, setDraft] = useState<ProfileType | null>(null);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [navy, setNavy] = useState<NavyInputs>({ waistCm: '', neckCm: '', hipCm: '' });
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !draft) setDraft(profile);
  }, [profile, draft]);

  const loadWeights = async (): Promise<void> => {
    if (!user) return;
    const { data } = await supabase
      .from('weight_log')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60);
    setWeights((data as WeightLog[]) || []);
  };
  useEffect(() => { loadWeights(); }, [user]); // eslint-disable-line

  const save = async (): Promise<void> => {
    if (!draft) return;
    await update({
      name: draft.name,
      sex: draft.sex,
      date_of_birth: draft.date_of_birth,
      height_cm: Number(draft.height_cm) || null,
      activity_level: draft.activity_level,
      goal_weight_kg: Number(draft.goal_weight_kg) || null,
      goal_pace: draft.goal_pace,
    });
  };

  const addWeight = async (): Promise<void> => {
    if (!user || !newWeight) return;
    await supabase.from('weight_log').upsert({
      user_id: user.id,
      date: newDate,
      weight_kg: Number(newWeight),
    }, { onConflict: 'user_id,date' });
    setNewWeight('');
    loadWeights();
  };

  const deleteWeight = async (id: string): Promise<void> => {
    if (!user) return;
    await supabase.from('weight_log').delete().eq('id', id).eq('user_id', user.id);
    loadWeights();
  };

  const onHealthFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportStatus('Reading…');
    const text = await f.text();
    setImportStatus('Parsing…');
    const parsed = parseAppleHealthExport(text);
    if (parsed.errors.length) {
      setImportStatus(`Error: ${parsed.errors[0]}`);
      return;
    }
    if (parsed.weight.length && user) {
      await supabase.from('weight_log').upsert(
        parsed.weight.map((w) => ({ user_id: user.id, date: w.date, weight_kg: w.weight_kg })),
        { onConflict: 'user_id,date' }
      );
    }
    if (parsed.energy.length && user) {
      await supabase.from('activity_log').insert(
        parsed.energy.map((r) => ({ ...r, user_id: user.id }))
      );
    }
    setImportStatus(
      `Imported ${parsed.weight.length} weight, ${parsed.energy.length} activity, ${parsed.steps.length} step records.`
    );
    loadWeights();
  };

  const bmiValue = bmi({ weightKg: currentWeightKg, heightCm: Number(profile?.height_cm) });
  const bf = bodyFatNavy({
    sex: profile?.sex,
    heightCm: Number(profile?.height_cm),
    waistCm: Number(navy.waistCm) || null,
    neckCm: Number(navy.neckCm) || null,
    hipCm: Number(navy.hipCm) || null,
  });

  if (!draft) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Profile</h1>

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Personal info</div>
        <div>
          <label className="label" htmlFor="profile-name">Name</label>
          <input id="profile-name" className="input" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sex</label>
            <select className="input" value={draft.sex || ''} onChange={(e) => setDraft({ ...draft, sex: (e.target.value || null) as Sex | null })}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" value={draft.date_of_birth || ''} onChange={(e) => setDraft({ ...draft, date_of_birth: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input" value={draft.height_cm || ''} onChange={(e) => setDraft({ ...draft, height_cm: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="label">Activity level</label>
            <select className="input" value={draft.activity_level || ''} onChange={(e) => setDraft({ ...draft, activity_level: (e.target.value || null) as ActivityLevel | null })}>
              <option value="">—</option>
              <option value="sedentary">Sedentary</option>
              <option value="lightly_active">Lightly active</option>
              <option value="moderately_active">Moderately active</option>
              <option value="very_active">Very active</option>
              <option value="extra_active">Extra active</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Goal weight (kg)</label>
            <input type="number" step="0.1" className="input" value={draft.goal_weight_kg || ''} onChange={(e) => setDraft({ ...draft, goal_weight_kg: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="label">Pace</label>
            <select className="input" value={draft.goal_pace || 'maintain'} onChange={(e) => setDraft({ ...draft, goal_pace: e.target.value as GoalPace })}>
              <option value="lose_1kg">Lose 1 kg/week</option>
              <option value="lose_0_5kg">Lose 0.5 kg/week</option>
              <option value="maintain">Maintain</option>
              <option value="gain_0_5kg">Gain 0.5 kg/week</option>
              <option value="gain_1kg">Gain 1 kg/week</option>
            </select>
          </div>
        </div>
        <button onClick={save} className="btn-primary">Save</button>
      </section>

      <section className="card p-4">
        <div className="font-semibold mb-3">Computed metrics</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Metric label="Age" value={age ?? '—'} />
          <Metric label="BMR" value={bmr ? `${bmr} kcal` : '—'} />
          <Metric label="TDEE" value={tdee ? `${tdee} kcal` : '—'} />
          <Metric label="Goal" value={`${calorieTarget} kcal`} />
          <Metric label="BMI" value={bmiValue ? `${bmiValue} (${bmiCategory(bmiValue)})` : '—'} />
          <Metric label="Weight" value={currentWeightKg ? `${currentWeightKg} kg` : '—'} />
          <Metric label="Body fat" value={bf ? `${bf}%` : '—'} />
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Body fat (Navy method, optional)</div>
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="Waist cm" value={navy.waistCm} onChange={(e) => setNavy({ ...navy, waistCm: e.target.value })} />
            <input className="input" placeholder="Neck cm" value={navy.neckCm} onChange={(e) => setNavy({ ...navy, neckCm: e.target.value })} />
            {profile?.sex === 'female' && <input className="input" placeholder="Hip cm" value={navy.hipCm} onChange={(e) => setNavy({ ...navy, hipCm: e.target.value })} />}
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="font-semibold mb-2">Weight history</div>
        <div className="flex gap-2 mb-3">
          <input type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <input type="number" step="0.1" placeholder="kg" className="input" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
          <button onClick={addWeight} className="btn-primary">Add</button>
        </div>
        <div className="max-h-56 overflow-auto divide-y" style={{ borderColor: 'var(--border)' }}>
          {weights.length === 0 && <div className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>No entries yet</div>}
          {weights.map((w) => (
            <div key={w.id} className="flex justify-between py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
              <span>{w.date}</span>
              <span>{w.weight_kg} kg</span>
              <button onClick={() => deleteWeight(w.id)} className="opacity-60 hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <div className="font-semibold mb-2">Apple Health import</div>
        <input type="file" accept=".xml" onChange={onHealthFile} className="block text-sm" />
        {importStatus && <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{importStatus}</div>}
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Export from iPhone Health app → unzip → upload <code>export.xml</code>.
        </div>
      </section>
    </div>
  );
}

interface MetricProps { label: string; value: ReactNode }
function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
