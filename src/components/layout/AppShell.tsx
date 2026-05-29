import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useProfile } from '../../hooks/useProfile';

export default function AppShell() {
  const { profile } = useProfile();
  useEffect(() => {
    if (profile?.dark_mode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [profile?.dark_mode]);
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
