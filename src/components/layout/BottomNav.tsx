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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-6 px-1 pt-2 pb-1">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 text-[10px] font-medium transition ${isActive ? '' : 'opacity-60'}`}
            style={({ isActive }) => isActive ? { color: 'var(--brand)' } : undefined}>
            <Icon size={22} strokeWidth={2} strokeLinecap="round" />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
