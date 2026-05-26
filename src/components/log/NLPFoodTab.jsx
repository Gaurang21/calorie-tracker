import { useState } from 'react';
import { parseNaturalLanguageFood } from '../../services/ollamaService.js';

export default function NLPFoodTab({ meal, onSaveMany }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState(null);
  const [logging, setLogging] = useState(false);

  const parse = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    setItems(null);
    try {
      const res = await parseNaturalLanguageFood(text.trim());
      setItems(res.items || []);
    } catch (e) {
      setError(e.message || 'AI features unavailable — check your server connection');
    } finally {
      setBusy(false);
    }
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = (items || []).reduce((acc, it) => acc + (Number(it.calories) || 0), 0);

  const logAll = async () => {
    if (!items?.length) return;
    setLogging(true);
    try {
      const rows = items.map((it) => ({
        meal,
        name: it.name,
        calories: Math.round(Number(it.calories) || 0),
        protein_g: Number(it.protein_g) || 0,
        carbs_g: Number(it.carbs_g) || 0,
        fat_g: Number(it.fat_g) || 0,
        serving_size: it.serving || null,
        source: 'manual',
      }));
      await onSaveMany(rows);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        data-testid="nlp-input"
        className="input min-h-[100px]"
        placeholder="e.g. I had a bowl of oatmeal with banana and a coffee with oat milk"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button data-testid="nlp-parse" onClick={parse} disabled={busy || !text.trim()} className="btn-primary w-full">
        {busy ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Figuring out your meal…
          </span>
        ) : (
          '✨ Parse with AI'
        )}
      </button>

      {error && (
        <div className="card p-3 text-sm" data-testid="nlp-error" style={{ color: 'var(--danger)' }}>
          {error}
          <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Try the Manual tab instead.</div>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-2" data-testid="nlp-results">
          {items.map((it, i) => (
            <div key={i} className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  className="input flex-1"
                  value={it.name || ''}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                />
                <button onClick={() => removeItem(i)} aria-label={`Remove ${it.name}`} className="ml-2 opacity-60 hover:opacity-100">✕</button>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{it.serving}</div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <Field label="kcal" value={it.calories} onChange={(v) => updateItem(i, { calories: v })} />
                <Field label="P" value={it.protein_g} onChange={(v) => updateItem(i, { protein_g: v })} />
                <Field label="C" value={it.carbs_g} onChange={(v) => updateItem(i, { carbs_g: v })} />
                <Field label="F" value={it.fat_g} onChange={(v) => updateItem(i, { fat_g: v })} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm pt-1">
            <span style={{ color: 'var(--text-muted)' }}>Total</span>
            <span className="font-semibold">{total} kcal</span>
          </div>
          <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            AI estimates — please verify before saving
          </div>
          <button data-testid="nlp-log-all" onClick={logAll} disabled={logging} className="btn-primary w-full">
            {logging ? 'Logging…' : `Log All ${items.length} Items`}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <input
        type="number"
        className="input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
