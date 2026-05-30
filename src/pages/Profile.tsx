import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useDailyTargets } from '../hooks/useDailyTargets';
import { bmi, bmiCategory, bodyFatNavy } from '../utils/calculations';
import { parseAppleHealthExport } from '../utils/appleHealthParser';
import type { Profile as ProfileType, Sex, ActivityLevel, GoalPace, WeightLog } from '../types/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { todayLocalISO } from '../utils/date';

interface NavyInputs { waistCm: string; neckCm: string; hipCm: string }

export default function Profile() {
  const { user } = useAuth();
  const { profile, update } = useProfile();
  const { bmr, tdee, calorieTarget, currentWeightKg, age } = useDailyTargets(profile);
  const [draft, setDraft] = useState<ProfileType | null>(null);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(todayLocalISO());
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

      <Card className="p-4 space-y-3">
        <div className="font-semibold">Personal info</div>
        <div>
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Sex</Label>
            <Select value={draft.sex || '_none'} onValueChange={(v) => setDraft({ ...draft, sex: (v === '_none' ? null : v) as Sex | null })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date of birth</Label>
            <Input type="date" value={draft.date_of_birth || ''} onChange={(e) => setDraft({ ...draft, date_of_birth: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Height (cm)</Label>
            <Input type="number" value={draft.height_cm || ''} onChange={(e) => setDraft({ ...draft, height_cm: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <Label>Activity level</Label>
            <Select value={draft.activity_level || '_none'} onValueChange={(v) => setDraft({ ...draft, activity_level: (v === '_none' ? null : v) as ActivityLevel | null })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="lightly_active">Lightly active</SelectItem>
                <SelectItem value="moderately_active">Moderately active</SelectItem>
                <SelectItem value="very_active">Very active</SelectItem>
                <SelectItem value="extra_active">Extra active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Goal weight (kg)</Label>
            <Input type="number" step="0.1" value={draft.goal_weight_kg || ''} onChange={(e) => setDraft({ ...draft, goal_weight_kg: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <Label>Pace</Label>
            <Select value={draft.goal_pace || 'maintain'} onValueChange={(v) => setDraft({ ...draft, goal_pace: v as GoalPace })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lose_1kg">Lose 1 kg/week</SelectItem>
                <SelectItem value="lose_0_5kg">Lose 0.5 kg/week</SelectItem>
                <SelectItem value="maintain">Maintain</SelectItem>
                <SelectItem value="gain_0_5kg">Gain 0.5 kg/week</SelectItem>
                <SelectItem value="gain_1kg">Gain 1 kg/week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={save}>Save</Button>
      </Card>

      <Card className="p-4">
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
            <Input placeholder="Waist cm" value={navy.waistCm} onChange={(e) => setNavy({ ...navy, waistCm: e.target.value })} />
            <Input placeholder="Neck cm" value={navy.neckCm} onChange={(e) => setNavy({ ...navy, neckCm: e.target.value })} />
            {profile?.sex === 'female' && <Input placeholder="Hip cm" value={navy.hipCm} onChange={(e) => setNavy({ ...navy, hipCm: e.target.value })} />}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Weight history</div>
        <div className="flex gap-2 mb-3">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <Input type="number" step="0.1" placeholder="kg" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
          <Button onClick={addWeight}>Add</Button>
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
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Apple Health import</div>
        <input type="file" accept=".xml" onChange={onHealthFile} className="block text-sm" />
        {importStatus && <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{importStatus}</div>}
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Export from iPhone Health app → unzip → upload <code>export.xml</code>.
        </div>
      </Card>
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
