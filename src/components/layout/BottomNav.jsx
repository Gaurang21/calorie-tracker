import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/log', label: 'Log', icon: '🍽️' },
  { to: '/trends', label: 'Trends', icon: '📈' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-xs transition ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'opacity-60'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
