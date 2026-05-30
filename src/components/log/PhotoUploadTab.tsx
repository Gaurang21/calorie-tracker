import { useState, type ChangeEvent } from 'react';
import { analyzeFoodPhoto, type PhotoAnalysisResult } from '../../services/geminiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { Meal, FoodLog } from '../../types/db';

interface Props {
  meal: Meal;
  onSave: (entry: Partial<FoodLog>) => Promise<unknown>;
}

interface Editable {
  name: string;
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
}

export default function PhotoUploadTab({ meal, onSave }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [editable, setEditable] = useState<Editable | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setResult(null);
    setEditable(null);
  };

  const analyze = async (): Promise<void> => {
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
      setError((e as Error).message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const confirm = async (): Promise<void> => {
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
            <Button onClick={analyze} disabled={analyzing} className="w-full mt-3">
              {analyzing ? 'Analyzing your meal…' : 'Analyze with AI'}
            </Button>
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
        <Card className="p-3 space-y-2" data-testid="ai-result">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Confidence: <span className="font-medium">{result.confidence}</span>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={editable.name} onChange={(e) => setEditable({ ...editable, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Calories</Label>
              <Input type="number" value={editable.calories} onChange={(e) => setEditable({ ...editable, calories: e.target.value })} />
            </div>
            <div>
              <Label>Protein</Label>
              <Input type="number" value={editable.protein_g} onChange={(e) => setEditable({ ...editable, protein_g: e.target.value })} />
            </div>
            <div>
              <Label>Carbs</Label>
              <Input type="number" value={editable.carbs_g} onChange={(e) => setEditable({ ...editable, carbs_g: e.target.value })} />
            </div>
            <div>
              <Label>Fat</Label>
              <Input type="number" value={editable.fat_g} onChange={(e) => setEditable({ ...editable, fat_g: e.target.value })} />
            </div>
          </div>
          <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            AI estimates are approximate — please verify
          </div>
          <Button onClick={confirm} className="w-full">Confirm & Log</Button>
        </Card>
      )}

      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
    </div>
  );
}
