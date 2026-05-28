import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import { useProfile } from '../../hooks/useProfile.js';

export default function AppShell() {
  const { profile } = useProfile();

  useEffect(() => {
    const dark = profile?.dark_mode;
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [profile?.dark_mode]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
