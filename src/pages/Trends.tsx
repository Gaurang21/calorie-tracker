import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useDailyTargets } from '../hooks/useDailyTargets';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { ISODate } from '../types/db';

type SeriesRow = { date: string } & Record<string, string | number | null>;

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 9999, label: 'All time' },
];

function dateRange(days: number): { start: ISODate; end: ISODate } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function fillSeries<T extends { date: string }>(rows: T[], days: number, key: string, valueFn: (r: T) => number): SeriesRow[] {
  const map = new Map(rows.map((r) => [r.date, valueFn(r)]));
  const out: SeriesRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso.slice(5), [key]: map.get(iso) ?? 0 });
  }
  return out;
}

function movingAvg(arr: SeriesRow[], key: string, window = 7): SeriesRow[] {
  return arr.map((row, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1).map((r) => Number(r[key] || 0)).filter((v) => v > 0);
    const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
    return { ...row, [`${key}_avg`]: avg ? +avg.toFixed(1) : null };
  });
}

export default function Trends() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { calorieTarget } = useDailyTargets(profile);
  const [days, setDays] = useState(30);
  const [weight, setWeight] = useState<SeriesRow[]>([]);
  const [foodByDay, setFoodByDay] = useState<SeriesRow[]>([]);
  const [activityByDay, setActivityByDay] = useState<SeriesRow[]>([]);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (!user) return;
    const { start } = dateRange(days);
    Promise.all([
      supabase.from('weight_log').select('date, weight_kg').eq('user_id', user.id).gte('date', start).order('date'),
      supabase.from('food_log').select('date, calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('date', start),
      supabase.from('activity_log').select('date, calories_burned').eq('user_id', user.id).gte('date', start),
    ]).then(([w, f, a]: [
      { data: { date: ISODate; weight_kg: number }[] | null },
      { data: { date: ISODate; calories: number; protein_g: number; carbs_g: number; fat_g: number }[] | null },
      { data: { date: ISODate; calories_burned: number }[] | null },
    ]) => {
      setWeight(movingAvg(fillSeries((w.data || []), days, 'kg', (r) => Number(r.weight_kg)), 'kg', 7));

      const fmap: Record<string, number> = {};
      let p = 0, c = 0, fat = 0;
      (f.data || []).forEach((r) => {
        fmap[r.date] = (fmap[r.date] || 0) + (r.calories || 0);
        p += Number(r.protein_g || 0);
        c += Number(r.carbs_g || 0);
        fat += Number(r.fat_g || 0);
      });
      const foodSeries = fillSeries(
        Object.entries(fmap).map(([date, calories]) => ({ date, calories })),
        days, 'calories', (r) => r.calories);
      setFoodByDay(foodSeries);
      setMacros({ protein: p, carbs: c, fat });

      const amap: Record<string, number> = {};
      (a.data || []).forEach((r) => {
        amap[r.date] = (amap[r.date] || 0) + (r.calories_burned || 0);
      });
      const actSeries = fillSeries(
        Object.entries(amap).map(([date, burned]) => ({ date, burned })),
        days, 'burned', (r) => r.burned);
      setActivityByDay(actSeries);
    });
  }, [user, days]);

  const netSeries: SeriesRow[] = foodByDay.map((row, i) => ({
    date: row.date,
    net: Number(row['calories'] || 0) - Number(activityByDay[i]?.['burned'] || 0),
  }));

  const macroPie = [
    { name: 'Protein', value: macros.protein, color: '#3b82f6' },
    { name: 'Carbs', value: macros.carbs, color: '#f59e0b' },
    { name: 'Fat', value: macros.fat, color: '#ef4444' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Trends</h1>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="max-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <Card className="p-4">
        <div className="font-semibold mb-2">Weight history</div>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={weight} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="var(--brand)" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="kg_avg" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Calories vs target</div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={foodByDay} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip />
              <Bar dataKey="calories" fill="var(--brand)" />
              <Line type="monotone" dataKey={() => calorieTarget} stroke="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Macro distribution</div>
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={macroPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {macroPie.map((m) => <Cell key={m.name} fill={m.color} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Net calories</div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={netSeries} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip />
              <Bar dataKey="net" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Goal projection</div>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={weight} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="kg_avg" stroke="var(--brand)" dot={false} />
              <Line type="monotone" dataKey={() => Number(profile?.goal_weight_kg || 0)} stroke="#ef4444" strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
