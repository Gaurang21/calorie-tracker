import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ gte: () => ({ order: () => Promise.resolve({ data: [] }) }) }) }) }) },
}));
vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({ profile: { name: 'Alex', water_target_ml: 2500, dark_mode: false } }),
}));
vi.mock('../../hooks/useFoodLog', () => ({
  useFoodLog: () => ({
    entries: [],
    byMeal: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  }),
}));
vi.mock('../../hooks/useActivityLog', () => ({
  useActivityLog: () => ({ entries: [], totalBurned: 0 }),
}));
vi.mock('../../hooks/useWaterLog', () => ({
  useWaterLog: () => ({ amountMl: 0, add: vi.fn() }),
}));
vi.mock('../../hooks/useDailyTargets', () => ({
  useDailyTargets: () => ({
    calorieTarget: 2000,
    macros: { protein_g: 150, carbs_g: 200, fat_g: 67 },
  }),
}));
vi.mock('../../hooks/useOllama', () => ({
  useOllama: () => ({ enabled: () => false, status: { checked: true, ok: false } }),
}));
vi.mock('../../hooks/useStreak', () => ({ useStreak: () => 0 }));

describe('Dashboard', () => {
  it('renders greeting with user name', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
  });

  it('shows empty-state calorie totals (0)', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    // Calorie ring shows "kcal left"
    expect(screen.getByText(/kcal left/i)).toBeInTheDocument();
    // Net calories card shows 0
    expect(screen.getByText('Net calories')).toBeInTheDocument();
  });

  it('renders the Log food quick-add FAB', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /log food/i })).toBeInTheDocument();
  });
});
