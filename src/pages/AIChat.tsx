import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useDailyTargets } from '../hooks/useDailyTargets';
import { answerDataQuestion } from '../services/aiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ISODate } from '../types/db';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  error?: boolean;
}

interface DayMacros { calories: number; protein_g: number; carbs_g: number; fat_g: number }

const STARTERS = [
  'How many calories did I average last week?',
  'What\'s my most logged food?',
  'Am I hitting my protein goal?',
  'What\'s my weight trend?',
];

function isoDateOffset(days: number): ISODate {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function AIChat() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { calorieTarget, macros } = useDailyTargets(profile);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const buildContext = async (): Promise<unknown> => {
    if (!user) return {};
    const since = isoDateOffset(30);
    const [food, weight, activity] = await Promise.all([
      supabase.from('food_log').select('date, name, calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('date', since),
      supabase.from('weight_log').select('date, weight_kg').eq('user_id', user.id).gte('date', since).order('date'),
      supabase.from('activity_log').select('date, activity_type, calories_burned').eq('user_id', user.id).gte('date', since),
    ]) as [
      { data: { date: ISODate; name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[] | null },
      { data: { date: ISODate; weight_kg: number }[] | null },
      { data: { date: ISODate; activity_type: string; calories_burned: number }[] | null },
    ];

    const foodByDay: Record<string, DayMacros> = {};
    const foodFreq: Record<string, number> = {};
    (food.data || []).forEach((r) => {
      foodByDay[r.date] = foodByDay[r.date] || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      foodByDay[r.date]!.calories += r.calories || 0;
      foodByDay[r.date]!.protein_g += Number(r.protein_g || 0);
      foodByDay[r.date]!.carbs_g += Number(r.carbs_g || 0);
      foodByDay[r.date]!.fat_g += Number(r.fat_g || 0);
      foodFreq[r.name] = (foodFreq[r.name] || 0) + 1;
    });
    const days = Object.keys(foodByDay);
    const avgCalories = days.length ? Math.round(days.reduce((a, d) => a + (foodByDay[d]?.calories || 0), 0) / days.length) : 0;
    const avgProtein = days.length ? Math.round(days.reduce((a, d) => a + (foodByDay[d]?.protein_g || 0), 0) / days.length) : 0;
    const mostLogged = Object.entries(foodFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    return {
      profile: {
        name: profile?.name,
        calorie_goal: calorieTarget,
        protein_goal: macros?.protein_g,
        goal_pace: profile?.goal_pace,
      },
      last_30_days: {
        days_logged: days.length,
        avg_daily_calories: avgCalories,
        avg_daily_protein_g: avgProtein,
        most_logged_foods: mostLogged,
        weight_history: (weight.data || []).map((w) => ({ date: w.date, kg: Number(w.weight_kg) })),
        activity_sessions: (activity.data || []).length,
      },
    };
  };

  const send = async (question?: string): Promise<void> => {
    const q = (question ?? input).trim();
    if (!q) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const ctx = await buildContext();
      const answer = await answerDataQuestion(q, ctx);
      setMessages((m) => [...m, { role: 'ai', content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', content: "Couldn't reach AI — try again.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); send(); };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)]">
      <header className="mb-3">
        <h1 className="text-xl font-bold">AI Chat</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ask anything about your data.</p>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-1" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="space-y-2" data-testid="chat-starters">
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Try one of these:</div>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left p-3 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && <div className="mr-2 text-lg">✨</div>}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-500 text-white' : ''}`}
              style={m.role === 'ai' ? { backgroundColor: 'var(--surface-2)' } : {}}
            >
              {m.content}
              {m.error && (
                <button onClick={() => send(messages[i - 1]?.content)} className="block mt-1 underline">Retry</button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }} data-testid="chat-typing">
            <span className="mr-1 text-lg">✨</span>
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 mt-3">
        <Input
          data-testid="chat-input"
          className="flex-1"
          placeholder="Ask anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button data-testid="chat-send" disabled={busy || !input.trim()}>Send</Button>
      </form>
    </div>
  );
}
