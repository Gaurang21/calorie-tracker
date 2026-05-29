import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';

function renderAt(path = '/secret') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    (useAuth as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({ user: null, loading: false });
    renderAt('/secret');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).toBeNull();
  });

  it('renders children when authenticated', () => {
    (useAuth as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({ user: { id: 'u1' }, loading: false });
    renderAt('/secret');
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('shows loading state while session resolves', () => {
    (useAuth as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({ user: null, loading: true });
    renderAt('/secret');
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });
});
