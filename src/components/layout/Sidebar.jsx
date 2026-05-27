import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const items = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/log', label: 'Log', icon: '🍽️' },
  { to: '/trends', label: 'Trends', icon: '📈' },
  { to: '/ai-chat', label: 'AI Chat', icon: '💬' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const nav = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    nav('/login');
  };

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 h-screen sticky top-0 border-r" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-brand-500 grid place-items-center text-white font-bold">C</div>
        <div className="font-bold">Calorie Tracker</div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="px-3 py-2 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {user?.email}
        </div>
        <button onClick={handleSignOut} className="btn-ghost w-full justify-start text-sm">
          <span>↩</span> Sign out
        </button>
      </div>
    </aside>
  );
}
