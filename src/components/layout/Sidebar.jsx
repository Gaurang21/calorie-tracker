import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, LineChart, Sparkles, User, Settings as SettingsIcon, LogOut, Zap } from 'lucide-react';
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
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 h-screen sticky top-0 border-r"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="px-5 pt-6 pb-6 flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-md grid place-items-center text-white"
          style={{ backgroundColor: 'var(--brand)', boxShadow: '0 6px 18px var(--brand-glow)' }}>
          <Zap size={20} strokeWidth={2.5} fill="currentColor" />
        </div>
        <div>
          <div className="display text-[18px] uplabel leading-none">Tracker</div>
          <div className="display text-[10px] uplabel mt-1" style={{ color: 'var(--brand)' }}>ATHLETIC</div>
        </div>
      </div>
      <div className="px-3 mb-2">
        <div className="eyebrow px-2">WORKSPACE</div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium uppercase transition relative ${isActive ? '' : 'opacity-65 hover:opacity-100'}`
            }
            style={({ isActive }) => isActive ? {
              color: 'var(--brand)',
              borderLeft: '3px solid var(--brand)',
              paddingLeft: '9px',
              backgroundColor: 'var(--brand-soft)',
            } : { borderLeft: '3px solid transparent', paddingLeft: '9px' }}>
            <Icon size={16} strokeWidth={2.4} />
            <span style={{ letterSpacing: '0.06em' }}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-5 pt-4">
        <div className="hairline mb-3" />
        <div className="px-2 mb-2 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
        <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 w-full text-[12px] uppercase font-bold transition opacity-70 hover:opacity-100" style={{ letterSpacing: '0.08em' }}>
          <LogOut size={14} strokeWidth={2.4} /> Sign out
        </button>
      </div>
    </aside>
  );
}
