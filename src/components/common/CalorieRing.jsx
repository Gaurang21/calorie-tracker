export default function CalorieRing({ eaten = 0, target = 2000, burned = 0, size = 260 }) {
  const net = Math.max(0, eaten - burned);
  const pct = target > 0 ? Math.min(1, net / target) : 0;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const remaining = Math.max(0, target - net);
  const over = net > target;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-progress">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#5fd589" />
            <stop offset="100%" stopColor="#30D158" />
          </linearGradient>
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--ring-track)"
          strokeWidth={stroke}
          fill="none"
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          filter={over ? undefined : 'url(#ringGlow)'}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="hero-num text-[64px] tabular leading-none" style={{ letterSpacing: '-0.04em' }}>
          {remaining}
        </div>
        <div className="eyebrow mt-2">
          {over ? 'KCAL OVER' : 'KCAL LEFT'}
        </div>
        <div className="text-[13px] mt-1 tabular" style={{ color: 'var(--text-muted)' }}>
          {net} / {target}
        </div>
      </div>
    </div>
  );
}
