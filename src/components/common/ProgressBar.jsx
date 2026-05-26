export default function ProgressBar({ value = 0, max = 100, label, color = 'var(--brand)', right }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{right ?? `${Math.round(value)} / ${max}`}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
