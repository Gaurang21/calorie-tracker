import { useState } from 'react';
import { analyzeFoodPhoto } from '../../services/geminiService.js';

export default function PhotoUploadTab({ meal, onSave }) {
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [editable, setEditable] = useState(null);
  const [error, setError] = useState(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
    setResult(null);
    setEditable(null);
  };

  const analyze = async () => {
    if (!preview) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeFoodPhoto(preview);
      setResult(res);
      setEditable({
        name: res.foods.join(', '),
        calories: res.totalCalories,
        protein_g: res.protein,
        carbs_g: res.carbs,
        fat_g: res.fat,
      });
    } catch (e) {
      setError(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const confirm = async () => {
    if (!editable) return;
    await onSave({
      meal,
      name: editable.name,
      calories: Math.round(Number(editable.calories) || 0),
      protein_g: Number(editable.protein_g) || 0,
      carbs_g: Number(editable.carbs_g) || 0,
      fat_g: Number(editable.fat_g) || 0,
      source: 'photo_ai',
    });
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <input type="file" accept="image/*" capture="environment" onChange={onFile} className="block w-full text-sm" />
      </label>

      {preview && (
        <div>
          <img src={preview} alt="meal" className="w-full max-h-60 object-cover rounded-xl" />
          {!result && (
            <button onClick={analyze} disabled={analyzing} className="btn-primary w-full mt-3">
              {analyzing ? 'Analyzing your meal…' : 'Analyze with AI'}
            </button>
          )}
        </div>
      )}

      {analyzing && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="h-4 w-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          Analyzing your meal…
        </div>
      )}

      {result && editable && (
        <div className="card p-3 space-y-2" data-testid="ai-result">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Confidence: <span className="font-medium">{result.confidence}</span>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={editable.name} onChange={(e) => setEditable({ ...editable, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Calories</label>
              <input type="number" className="input" value={editable.calories} onChange={(e) => setEditable({ ...editable, calories: e.target.value })} />
            </div>
            <div>
              <label className="label">Protein</label>
              <input type="number" className="input" value={editable.protein_g} onChange={(e) => setEditable({ ...editable, protein_g: e.target.value })} />
            </div>
            <div>
              <label className="label">Carbs</label>
              <input type="number" className="input" value={editable.carbs_g} onChange={(e) => setEditable({ ...editable, carbs_g: e.target.value })} />
            </div>
            <div>
              <label className="label">Fat</label>
              <input type="number" className="input" value={editable.fat_g} onChange={(e) => setEditable({ ...editable, fat_g: e.target.value })} />
            </div>
          </div>
          <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            AI estimates are approximate — please verify
          </div>
          <button onClick={confirm} className="btn-primary w-full">Confirm & Log</button>
        </div>
      )}

      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
    </div>
  );
}
