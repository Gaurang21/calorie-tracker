import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Sparkles, LineChart, User, Settings as SettingsIcon } from 'lucide-react';

const items = [
  { to: '/',         label: 'HOME',     Icon: Home },
  { to: '/log',      label: 'LOG',      Icon: BookOpen },
  { to: '/ai-chat',  label: 'AI',       Icon: Sparkles },
  { to: '/trends',   label: 'TRENDS',   Icon: LineChart },
  { to: '/profile',  label: 'PROFILE',  Icon: User },
  { to: '/settings', label: 'MORE',     Icon: SettingsIcon },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-6">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-[9px] font-bold transition relative ${isActive ? '' : 'opacity-60'}`}
            style={({ isActive }) => isActive ? {
              color: 'var(--brand)',
              borderTop: '3px solid var(--brand)',
              marginTop: '-3px',
              letterSpacing: '0.08em',
            } : { letterSpacing: '0.08em' }}>
            <Icon size={18} strokeWidth={2.4} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
