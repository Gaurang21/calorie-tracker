interface CalorieRingProps {
  eaten?: number;
  target?: number;
  burned?: number;
  size?: number;
}

export default function CalorieRing({ eaten = 0, target = 2000, burned = 0, size = 220 }: CalorieRingProps) {
  const net = Math.max(0, eaten - burned);
  const pct = target > 0 ? Math.min(1, net / target) : 0;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const remaining = Math.max(0, target - net);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-progress">
        <defs>
          <linearGradient id="warmRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FF8A65" />
            <stop offset="50%"  stopColor="#FFA683" />
            <stop offset="100%" stopColor="#A8C5A0" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--ring-track)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="url(#warmRing)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="hero-num text-[56px]">{remaining}</div>
        <div className="text-[12px] font-medium mt-2" style={{ color: 'var(--text-muted)' }}>
          kcal left to enjoy
        </div>
        <div className="text-[12px] mt-1 tabular" style={{ color: 'var(--text-muted)' }}>
          {net} / {target}
        </div>
      </div>
    </div>
  );
}
