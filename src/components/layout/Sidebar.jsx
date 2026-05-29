import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, LineChart, Sparkles, User, Settings as SettingsIcon, LogOut, Sun } from 'lucide-react';
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
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0" style={{ backgroundColor: 'var(--bg)', borderRight: '1px solid var(--hairline)' }}>
      <div className="px-6 pt-7 pb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-3xl grid place-items-center text-white"
          style={{ background: 'linear-gradient(135deg, #FF8A65, #A8C5A0)', boxShadow: '0 8px 22px var(--brand-glow)' }}>
          <Sun size={20} strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-semibold text-[15px] leading-none">Calorie Tracker</div>
          <div className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>good vibes only</div>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-all duration-300 ${isActive ? '' : 'opacity-70 hover:opacity-100'}`}
            style={({ isActive }) => isActive ? {
              backgroundColor: 'var(--surface)',
              color: 'var(--brand)',
              boxShadow: '0 4px 12px rgba(120, 95, 70, 0.06)',
            } : undefined}>
            <Icon size={18} strokeWidth={2} strokeLinecap="round" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-5 pt-4">
        <div className="hairline mb-4" />
        <div className="px-2 mb-2 text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
        <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 w-full rounded-2xl text-[14px] transition hover:bg-black/5 dark:hover:bg-white/5">
          <LogOut size={16} strokeWidth={2} /> Sign out
        </button>
      </div>
    </aside>
  );
}
