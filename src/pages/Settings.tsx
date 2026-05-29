import { useEffect, useState, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useOllama } from '../hooks/useOllama';
import { testConnection, provider, providerLabel } from '../services/aiService';
import type { UserFood, Units, AIFeatureFlags } from '../types/db';

type AIFeatureKey = keyof Required<AIFeatureFlags>;

const AI_FEATURE_LABELS: Record<AIFeatureKey, string> = {
  weekly_summary: 'Weekly Summary',
  ask_anything: 'Ask Anything Chat',
  meal_suggestions: 'Meal Suggestions',
  food_swap: 'Food Swap Suggestions',
  daily_insights: 'Daily Insights',
  goal_pacing: 'Goal Pacing Coach',
  workout_suggestions: 'Workout Suggestions',
};

interface ConnStatus { checked: boolean; ok: boolean; models: string[]; error: string | null }

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, update } = useProfile();
  const { flags, setFlag } = useOllama();
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [exportBusy, setExportBusy] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<ConnStatus>({ checked: false, ok: false, models: [], error: null });
  const [testing, setTesting] = useState(false);

  const loadFoods = async (): Promise<void> => {
    if (!user) return;
    const { data } = await supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('times_used', { ascending: false });
    setFoods((data as UserFood[]) || []);
  };
  useEffect(() => { loadFoods(); }, [user]); // eslint-disable-line

  if (!profile) return null;

  const toggleDark = async (): Promise<void> => {
    await update({ dark_mode: !profile.dark_mode });
  };

  const setUnits = async (u: Units) => update({ units: u });

  const deleteFood = async (id: string): Promise<void> => {
    if (!user) return;
    await supabase.from('user_foods').delete().eq('id', id).eq('user_id', user.id);
    loadFoods();
  };

  const exportData = async (): Promise<void> => {
    if (!user) return;
    setExportBusy(true);
    const [profileRes, weight, food, activity, water, userFoods, templates] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('weight_log').select('*').eq('user_id', user.id),
      supabase.from('food_log').select('*').eq('user_id', user.id),
      supabase.from('activity_log').select('*').eq('user_id', user.id),
      supabase.from('water_log').select('*').eq('user_id', user.id),
      supabase.from('user_foods').select('*').eq('user_id', user.id),
      supabase.from('meal_templates').select('*').eq('user_id', user.id),
    ]);
    const blob = new Blob(
      [JSON.stringify({
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        weight_log: weight.data,
        food_log: food.data,
        activity_log: activity.data,
        water_log: water.data,
        user_foods: userFoods.data,
        meal_templates: templates.data,
      }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calorie-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportBusy(false);
  };

  const importData = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!user) return;
    const f = e.target.files?.[0];
    if (!f) return;
    setImportStatus('Importing…');
    try {
      const text = await f.text();
      const data = JSON.parse(text) as Record<string, Record<string, unknown>[]>;
      const tasks: PromiseLike<unknown>[] = [];
      if (data['weight_log']?.length) {
        tasks.push(supabase.from('weight_log').upsert(
          data['weight_log'].map((r) => ({ user_id: user.id, date: r['date'], weight_kg: r['weight_kg'], notes: r['notes'] })),
          { onConflict: 'user_id,date' }
        ));
      }
      if (data['food_log']?.length) {
        tasks.push(supabase.from('food_log').insert(
          data['food_log'].map((r) => ({ ...r, id: undefined, user_id: user.id }))
        ));
      }
      if (data['activity_log']?.length) {
        tasks.push(supabase.from('activity_log').insert(
          data['activity_log'].map((r) => ({ ...r, id: undefined, user_id: user.id }))
        ));
      }
      if (data['user_foods']?.length) {
        tasks.push(supabase.from('user_foods').insert(
          data['user_foods'].map((r) => ({ ...r, id: undefined, user_id: user.id }))
        ));
      }
      if (data['meal_templates']?.length) {
        tasks.push(supabase.from('meal_templates').insert(
          data['meal_templates'].map((r) => ({ ...r, id: undefined, user_id: user.id }))
        ));
      }
      await Promise.all(tasks);
      setImportStatus('Import complete.');
    } catch (err) {
      setImportStatus(`Error: ${(err as Error).message}`);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    if (!user) return;
    if (!confirm('Delete your account and ALL data? This cannot be undone.')) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await signOut();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Settings</h1>

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Appearance</div>
        <label className="flex items-center justify-between">
          <span>Dark mode</span>
          <input
            data-testid="dark-mode-toggle"
            type="checkbox"
            checked={!!profile.dark_mode}
            onChange={toggleDark}
          />
        </label>
        <div>
          <div className="label">Units</div>
          <div className="grid grid-cols-2 gap-2">
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                data-testid={`units-${u}`}
                onClick={() => setUnits(u)}
                className={`btn ${profile.units === u ? 'bg-brand-500 text-white' : 'btn-secondary'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Daily targets</div>
        <div>
          <label className="label">Calorie target override</label>
          <input
            type="number"
            className="input"
            value={profile.daily_calorie_override || ''}
            onChange={(e) => update({ daily_calorie_override: e.target.value ? Number(e.target.value) : null })}
            placeholder="Auto (computed from goal)"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">Protein %</label>
            <input type="number" className="input" value={profile.macro_protein_pct} onChange={(e) => update({ macro_protein_pct: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Carbs %</label>
            <input type="number" className="input" value={profile.macro_carbs_pct} onChange={(e) => update({ macro_carbs_pct: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Fat %</label>
            <input type="number" className="input" value={profile.macro_fat_pct} onChange={(e) => update({ macro_fat_pct: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label">Water goal (ml)</label>
          <input type="number" className="input" value={profile.water_target_ml} onChange={(e) => update({ water_target_ml: Number(e.target.value) })} />
        </div>
      </section>

      <section className="card p-4 space-y-3" data-testid="ai-settings">
        <div className="flex items-center justify-between">
          <div className="font-semibold">AI settings</div>
          <span data-testid="ai-provider" className="chip">
            Provider: <b className="ml-1">{providerLabel}</b>
          </span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Switch with <code>VITE_AI_PROVIDER=groq</code> or <code>ollama</code> in <code>.env</code>, then restart the dev server.
        </div>

        {provider === 'ollama' && (
          <>
            <div>
              <label className="label">Ollama server URL</label>
              <input
                data-testid="ollama-url"
                className="input"
                placeholder="https://your-oracle-ip"
                value={profile.ollama_url || ''}
                onChange={(e) => update({ ollama_url: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Ollama API key</label>
              <input
                data-testid="ollama-key"
                type="password"
                className="input"
                value={profile.ollama_api_key || ''}
                onChange={(e) => update({ ollama_api_key: e.target.value })}
              />
            </div>
          </>
        )}
        {provider === 'groq' && (
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Groq key is read from <code>VITE_GROQ_API_KEY</code> in the environment, not from the user profile.
            Get one at <a className="underline" href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a>.
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            data-testid="test-connection"
            onClick={async () => {
              setTesting(true);
              const res = provider === 'ollama'
                ? await testConnection({ url: profile.ollama_url, apiKey: profile.ollama_api_key })
                : await testConnection();
              setConnStatus({ checked: true, ok: res.ok, models: res.models || [], error: res.error || null });
              setTesting(false);
            }}
            disabled={testing}
            className="btn-secondary"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          {connStatus.checked && (
            <span className="text-sm" data-testid="conn-status">
              {connStatus.ok
                ? `● Connected — ${connStatus.models?.[0] || 'model'} running ✅`
                : `● Disconnected ❌ ${connStatus.error || ''}`}
            </span>
          )}
        </div>

        <div className="pt-2">
          <div className="text-sm font-medium mb-2">AI features</div>
          <div className="space-y-2">
            {Object.entries(AI_FEATURE_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  data-testid={`flag-${key}`}
                  checked={flags[key] !== false}
                  onChange={(e) => setFlag(key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium mb-1">Photo analysis (Gemini)</div>
          <label className="label">Gemini API key</label>
          <input
            data-testid="gemini-key"
            type="password"
            className="input"
            value={profile.gemini_api_key || ''}
            onChange={(e) => update({ gemini_api_key: e.target.value })}
          />
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Get a free key at aistudio.google.com — required for photo calorie analysis.
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="font-semibold mb-2">My foods</div>
        {foods.length === 0 && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No saved foods yet</div>}
        <div className="max-h-60 overflow-auto divide-y" style={{ borderColor: 'var(--border)' }}>
          {foods.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div>{f.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.calories} kcal · used {f.times_used}×</div>
              </div>
              <button onClick={() => deleteFood(f.id)} className="opacity-60 hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Data</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportData} disabled={exportBusy} className="btn-secondary">
            {exportBusy ? 'Exporting…' : 'Export all my data (JSON)'}
          </button>
          <label className="btn-secondary cursor-pointer">
            Import from JSON
            <input type="file" accept="application/json" className="hidden" onChange={importData} />
          </label>
        </div>
        {importStatus && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{importStatus}</div>}
      </section>

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Account</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={signOut} className="btn-secondary">Sign out</button>
          <button onClick={deleteAccount} className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>Delete account</button>
        </div>
      </section>
    </div>
  );
}
