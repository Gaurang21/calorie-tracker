import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, LineChart, Sparkles, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const items = [
  { to: '/',         label: 'Dashboard', Icon: Home },
  { to: '/log',      label: 'Log',       Icon: BookOpen },
  { to: '/trends',   label: 'Trends',    Icon: LineChart },
  { to: '/ai-chat',  label: 'AI Chat',   Icon: Sparkles },
  { to: '/profile',  label: 'Profile',   Icon: User },
  { to: '/settings', label: 'Settings',  Icon: SettingsIcon },
];

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const nav = useNavigate();
  const handleSignOut = async () => { await signOut(); nav('/login'); };

  return (
    <aside className="hidden md:flex md:flex-col w-[200px] shrink-0 h-screen sticky top-0 border-r"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
      <div className="px-4 pt-5 pb-4 flex items-center gap-2">
        <div className="h-6 w-6 rounded grid place-items-center text-white font-medium text-[11px]"
          style={{ backgroundColor: 'var(--brand)' }}>C</div>
        <div className="text-[13px] font-medium">Calorie Tracker</div>
      </div>
      <div className="px-3 pb-1">
        <div className="eyebrow px-2">Workspace</div>
      </div>
      <nav className="flex-1 px-3 space-y-px">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition ${
                isActive ? 'font-medium' : 'opacity-70 hover:opacity-100'
              }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: 'var(--surface-2)', color: 'var(--text)' } : undefined}
          >
            <Icon size={14} strokeWidth={1.6} style={{ opacity: 0.7 }} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-4">
        <div className="hairline mb-3" />
        <div className="px-2 mb-2 text-[10px] truncate mono" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
        <button onClick={handleSignOut} className="flex items-center gap-2 px-2 py-1.5 w-full rounded text-[13px] opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition">
          <LogOut size={14} strokeWidth={1.6} /> Sign out
        </button>
      </div>
    </aside>
  );
}
