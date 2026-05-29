export default function CalorieRing({ eaten = 0, target = 2000, burned = 0, size = 180 }) {
  const net = Math.max(0, eaten - burned);
  const pct = target > 0 ? Math.min(1, net / target) : 0;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const remaining = Math.max(0, target - net);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-progress">
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--ring-track)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--brand)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray 0.1s linear' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="hero-num text-[40px]">{remaining}</div>
        <div className="eyebrow mt-2">kcal left</div>
        <div className="text-[11px] mt-1 mono" style={{ color: 'var(--text-muted)' }}>{net} / {target}</div>
      </div>
    </div>
  );
}
