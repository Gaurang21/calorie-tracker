export default function CalorieRing({ eaten = 0, target = 2000, burned = 0, size = 260 }) {
  const net = Math.max(0, eaten - burned);
  const pct = target > 0 ? Math.min(1, net / target) : 0;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const remaining = Math.max(0, target - net);
  const over = net > target;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-progress">
        <defs>
          <filter id="athGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--ring-track)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--brand)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}
          filter={over ? undefined : 'url(#athGlow)'}
          style={{ transition: 'stroke-dasharray 0.5s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="hero-num text-[80px]" style={{ color: 'var(--text)' }}>{remaining}</div>
        <div className="display text-[14px] uplabel mt-1" style={{ color: 'var(--brand)' }}>
          KCAL LEFT
        </div>
        <div className="text-[12px] mt-2 tabular font-medium" style={{ color: 'var(--text-muted)' }}>
          {net} / {target}
        </div>
      </div>
    </div>
  );
}
