export default function ProgressBar({ value = 0, max = 100, label, color = 'var(--brand)', right }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      {(label || right !== undefined) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uplabel" style={{ color: 'var(--text-soft)' }}>{label}</span>
          <span className="display text-[16px] tabular" style={{ color: 'var(--text)' }}>
            {right ?? `${Math.round(value)} / ${max}`}
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden" style={{ backgroundColor: 'var(--ring-track)' }}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.5s ease-out' }} />
      </div>
    </div>
  );
}
