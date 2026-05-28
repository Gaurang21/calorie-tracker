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

  const handleSignOut = async () => {
    await signOut();
    nav('/login');
  };

  return (
    <aside
      className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 border-r"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    >
      <div className="px-6 pt-6 pb-8 flex items-center gap-2.5">
        <div
          className="h-9 w-9 rounded-2xl grid place-items-center text-white font-semibold"
          style={{
            background: 'linear-gradient(135deg, #5fd589, #30D158)',
            boxShadow: '0 6px 16px var(--brand-glow)',
          }}
        >
          C
        </div>
        <div>
          <div className="font-semibold text-[15px] leading-none">Calorie Tracker</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>v1.0</div>
        </div>
      </div>

      <div className="px-4">
        <div className="eyebrow px-3 mb-2">Workspace</div>
      </div>
      <nav className="flex-1 px-4 space-y-0.5">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14px] font-medium transition ${
                isActive
                  ? 'bg-white/0 text-brand-600 dark:text-brand-400'
                  : 'opacity-80 hover:opacity-100'
              }`
            }
            style={({ isActive }) => isActive ? {
              backgroundColor: 'var(--surface)',
              color: 'var(--brand)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              border: '1px solid var(--border)',
            } : undefined}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-5 pt-4">
        <div className="hairline mb-4" />
        <div className="px-3 mb-2 text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
          {user?.email}
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2 w-full rounded-2xl text-[14px] transition hover:bg-black/5 dark:hover:bg-white/5">
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
