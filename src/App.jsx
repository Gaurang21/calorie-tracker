import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Log from './pages/Log.jsx';
import Trends from './pages/Trends.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import AIChat from './pages/AIChat.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<Log />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
