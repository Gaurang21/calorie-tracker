export default function ProgressBar({ value = 0, max = 100, label, color = 'var(--brand)', right }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      {(label || right !== undefined) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-soft)' }}>{label}</span>
          <span className="text-[12px] tabular" style={{ color: 'var(--text-muted)' }}>
            {right ?? `${Math.round(value)} / ${max}`}
          </span>
        </div>
      )}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ring-track)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  );
}
