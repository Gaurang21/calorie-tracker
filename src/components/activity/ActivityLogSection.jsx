import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { MET_VALUES, metCalories } from '../../utils/calculations.js';

const ACTIVITIES = [
  { id: 'running', label: '🏃 Running', met: MET_VALUES.running },
  { id: 'walking', label: '🚶 Walking', met: MET_VALUES.walking },
  { id: 'cycling', label: '🚴 Cycling', met: MET_VALUES.cycling },
  { id: 'swimming', label: '🏊 Swimming', met: MET_VALUES.swimming },
  { id: 'weight_training', label: '🏋️ Weight training', met: MET_VALUES.weight_training },
  { id: 'hiit', label: '⚡ HIIT', met: MET_VALUES.hiit },
  { id: 'yoga', label: '🧘 Yoga', met: MET_VALUES.yoga },
  { id: 'custom', label: '💪 Custom', met: null },
];

export default function ActivityLogSection({ entries, onAdd, onDelete, weightKg }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [overrode, setOverrode] = useState(false);

  const onSelectActivity = (a) => {
    setActivity(a);
    setOverrode(false);
    if (a.met && duration && weightKg) {
      setCalories(String(metCalories({ met: a.met, weightKg, durationMins: Number(duration) })));
    }
  };

  const onDurationChange = (e) => {
    setDuration(e.target.value);
    if (activity.met && !overrode && weightKg) {
      setCalories(String(metCalories({ met: activity.met, weightKg, durationMins: Number(e.target.value) })));
    }
  };

  const onCaloriesChange = (e) => {
    setCalories(e.target.value);
    setOverrode(true);
  };

  const submit = async (e) => {
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
        <button data-testid="add-activity" onClick={() => setOpen(true)} className="btn-secondary text-sm">+ Log activity</button>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Log activity">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelectActivity(a)}
                className={`p-2 rounded-xl border text-sm transition ${activity.id === a.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : ''}`}
                style={{ borderColor: activity.id === a.id ? 'var(--brand)' : 'var(--border)' }}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Duration (mins)</label>
            <input data-testid="duration" type="number" min="0" className="input" value={duration} onChange={onDurationChange} />
          </div>
          <div>
            <label className="label">Calories burned</label>
            <input data-testid="calories-burned" type="number" min="0" className="input" value={calories} onChange={onCaloriesChange} required />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button className="btn-primary w-full">Save</button>
        </form>
      </Modal>
    </section>
  );
}
