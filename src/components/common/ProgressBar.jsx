export default function ProgressBar({ value = 0, max = 100, label, color = 'var(--brand)', right }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      {(label || right !== undefined) && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-soft)' }}>{label}</span>
          <span className="text-[11px] mono" style={{ color: 'var(--text-muted)' }}>
            {right ?? `${Math.round(value)} / ${max}`}
          </span>
        </div>
      )}
      <div className="h-1 rounded-sm overflow-hidden" style={{ backgroundColor: 'var(--ring-track)' }}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}
