import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import { suggestFoodSwap } from '../../services/ollamaService.js';

export default function FoodSwapSheet({ open, onClose, food, macroGaps, onSwap }) {
  const [swaps, setSwaps] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !food) return;
    setSwaps(null);
    setError(null);
    setBusy(true);
    suggestFoodSwap(food, macroGaps || { protein: 0, carbs: 0, fat: 0 })
      .then((res) => setSwaps(res.swaps || []))
      .catch(() => setError('AI features unavailable — check your server connection'))
      .finally(() => setBusy(false));
  }, [open, food?.id]); // eslint-disable-line

  return (
    <Modal open={open} onClose={onClose} title={food ? `Smarter swaps for ${food.name}` : 'Swaps'}>
      {busy && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Finding alternatives…</div>}
      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
      {swaps && (
        <div className="space-y-2" data-testid="swap-list">
          {swaps.map((s, i) => {
            const diff = s.calories - (food?.calories || 0);
            const diffLabel = diff === 0 ? 'same as yours' : diff > 0 ? `+${diff} cal` : `${diff} cal`;
            const proteinDiff = Math.round((s.protein_g || 0) - (food?.protein_g || 0));
            return (
              <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.calories} cal — {diffLabel}
                      {proteinDiff !== 0 && ` · ${proteinDiff > 0 ? '+' : ''}${proteinDiff}g protein`}
                    </div>
                    <div className="text-xs mt-1">{s.reason}</div>
                  </div>
                  <button data-testid={`swap-${i}`} onClick={() => onSwap(s)} className="btn-primary text-xs">Log instead</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
