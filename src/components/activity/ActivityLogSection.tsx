import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MET_VALUES, metCalories } from '../../utils/calculations';
import type { ActivityLog } from '../../types/db';

interface ActivityOption {
  id: string;
  label: string;
  met: number | null;
}

interface Props {
  entries: ActivityLog[];
  onAdd: (entry: Partial<ActivityLog>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  weightKg: number;
}

const ACTIVITIES: ActivityOption[] = [
  { id: 'running', label: '🏃 Running', met: MET_VALUES.running },
  { id: 'walking', label: '🚶 Walking', met: MET_VALUES.walking },
  { id: 'cycling', label: '🚴 Cycling', met: MET_VALUES.cycling },
  { id: 'swimming', label: '🏊 Swimming', met: MET_VALUES.swimming },
  { id: 'weight_training', label: '🏋️ Weight training', met: MET_VALUES.weight_training },
  { id: 'hiit', label: '⚡ HIIT', met: MET_VALUES.hiit },
  { id: 'yoga', label: '🧘 Yoga', met: MET_VALUES.yoga },
  { id: 'custom', label: '💪 Custom', met: null },
];

export default function ActivityLogSection({ entries, onAdd, onDelete, weightKg }: Props) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityOption>(ACTIVITIES[0]!);
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [overrode, setOverrode] = useState(false);

  const onSelectActivity = (a: ActivityOption): void => {
    setActivity(a);
    setOverrode(false);
    if (a.met && duration && weightKg) {
      setCalories(String(metCalories({ met: a.met, weightKg, durationMins: Number(duration) })));
    }
  };

  const onDurationChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDuration(e.target.value);
    if (activity.met && !overrode && weightKg) {
      setCalories(String(metCalories({ met: activity.met, weightKg, durationMins: Number(e.target.value) })));
    }
  };

  const onCaloriesChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setCalories(e.target.value);
    setOverrode(true);
  };

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const burned = Math.round(Number(calories) || 0);
    if (!burned) return;
    await onAdd({
      activity_type: activity.id === 'custom' ? (notes || 'Custom') : activity.label,
      duration_mins: duration ? Number(duration) : null,
      calories_burned: burned,
      notes: notes || null,
    });
    setOpen(false);
    setDuration('');
    setCalories('');
    setNotes('');
  };

  return (
    <section className="card p-4" data-testid="activity-section">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">🔥 Activity</div>
        <Button data-testid="add-activity" variant="secondary" size="sm" onClick={() => setOpen(true)}>+ Log activity</Button>
      </div>
      {entries.length === 0 ? (
        <div className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>Nothing logged yet</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm">
              <div>
                <div>{e.activity_type}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {e.duration_mins ? `${e.duration_mins} min · ` : ''}{e.calories_burned} kcal
                </div>
              </div>
              <button onClick={() => onDelete(e.id)} aria-label="Delete activity" className="opacity-60 hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectActivity(a)}
                  className="p-2 rounded-xl border text-sm transition"
                  style={{ borderColor: activity.id === a.id ? 'var(--brand)' : 'var(--border)', backgroundColor: activity.id === a.id ? 'var(--brand-soft)' : 'transparent' }}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input id="duration" data-testid="duration" type="number" min="0" value={duration} onChange={onDurationChange} />
            </div>
            <div>
              <Label htmlFor="calories-burned">Calories burned</Label>
              <Input id="calories-burned" data-testid="calories-burned" type="number" min="0" value={calories} onChange={onCaloriesChange} required />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
