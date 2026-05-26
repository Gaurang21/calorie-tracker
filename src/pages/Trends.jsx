import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useProfile } from '../hooks/useProfile.js';
import { useDailyTargets } from '../hooks/useDailyTargets.js';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 9999, label: 'All time' },
];

function dateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function fillSeries(rows, days, key, valueFn) {
  const map = new Map(rows.map((r) => [r.date, valueFn(r)]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso.slice(5), [key]: map.get(iso) ?? 0 });
  }
  return out;
}

function movingAvg(arr, key, window = 7) {
  return arr.map((row, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1).map((r) => r[key]).filter((v) => v > 0);
    const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
    return { ...row, [`${key}_avg`]: avg ? +avg.toFixed(1) : null };
  });
}

export default function Trends() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { calorieTarget } = useDailyTargets(profile);
  const [days, setDays] = useState(30);
  const [weight, setWeight] = useState([]);
  const [foodByDay, setFoodByDay] = useState([]);
  const [activityByDay, setActivityByDay] = useState([]);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (!user) return;
    const { start } = dateRange(days);
    Promise.all([
      supabase.from('weight_log').select('date, weight_kg').eq('user_id', user.id).gte('date', start).order('date'),
      supabase.from('food_log').select('date, calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('date', start),
      supabase.from('activity_log').select('date, calories_burned').eq('user_id', user.id).gte('date', start),
    ]).then(([w, f, a]) => {
      setWeight(movingAvg(fillSeries((w.data || []), days, 'kg', (r) => Number(r.weight_kg)), 'kg', 7));

      const fmap = {};
      let p = 0, c = 0, fat = 0;
      (f.data || []).forEach((r) => {
        fmap[r.date] = (fmap[r.date] || 0) + (r.calories || 0);
        p += Number(r.protein_g || 0);
        c += Number(r.carbs_g || 0);
        fat += Number(r.fat_g || 0);
      });
      const foodSeries = fillSeries(Object.entries(fmap).map(([date, calories]) => ({ date, calories })), days, 'calories', (r) => r.calories);
      setFoodByDay(foodSeries);
      setMacros({ protein: p, carbs: c, fat });

      const amap = {};
      (a.data || []).forEach((r) => {
        amap[r.date] = (amap[r.date] || 0) + (r.calories_burned || 0);
      });
      const actSeries = fillSeries(Object.entries(amap).map(([date, burned]) => ({ date, burned })), days, 'burned', (r) => r.burned);
      setActivityByDay(actSeries);
    });
  }, [user, days]);

  const netSeries = foodByDay.map((row, i) => ({
    date: row.date,
    net: (row.calories || 0) - (activityByDay[i]?.burned || 0),
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
        <select className="input max-w-[140px]" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </header>

      <section className="card p-4">
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
      </section>

      <section className="card p-4">
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
      </section>

      <section className="card p-4">
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
      </section>

      <section className="card p-4">
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
      </section>

      <section className="card p-4">
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
      </section>
    </div>
  );
}
