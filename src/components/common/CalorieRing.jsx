export default function CalorieRing({ eaten = 0, target = 2000, burned = 0 }) {
  const net = Math.max(0, eaten - burned);
  const pct = target > 0 ? Math.min(1, net / target) : 0;
  const r = 70;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const remaining = Math.max(0, target - net);
  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg width="176" height="176" viewBox="0 0 176 176" className="ring-progress">
        <circle cx="88" cy="88" r={r} stroke="var(--surface-2)" strokeWidth="14" fill="none" />
        <circle
          cx="88"
          cy="88"
          r={r}
          stroke="var(--brand)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{remaining}</div>
        <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>kcal left</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {net} / {target}
        </div>
      </div>
    </div>
  );
}
