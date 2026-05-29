import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Sparkles, LineChart, User, Settings as SettingsIcon } from 'lucide-react';

const items = [
  { to: '/',         label: 'Home',     Icon: Home },
  { to: '/log',      label: 'Log',      Icon: BookOpen },
  { to: '/ai-chat',  label: 'AI',       Icon: Sparkles },
  { to: '/trends',   label: 'Trends',   Icon: LineChart },
  { to: '/profile',  label: 'Profile',  Icon: User },
  { to: '/settings', label: 'More',     Icon: SettingsIcon },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-6">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-[10px] mono transition ${isActive ? '' : 'opacity-60'}`
            }
            style={({ isActive }) => isActive ? { color: 'var(--brand)' } : undefined}>
            <Icon size={16} strokeWidth={1.6} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
