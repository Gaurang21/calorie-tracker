import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import { useProfile } from '../../hooks/useProfile.js';

export default function AppShell() {
  const { profile } = useProfile();
  useEffect(() => {
    if (profile?.dark_mode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [profile?.dark_mode]);
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
