import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AddFoodModal from './AddFoodModal.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../../lib/supabase.js', () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: [] }),
    insert: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { from: () => chain } };
});

describe('AddFoodModal', () => {
  it('renders all 5 tabs when open', () => {
    render(
      <AddFoodModal
        open
        onClose={() => {}}
        meal="breakfast"
        onAddEntry={vi.fn()}
        onAddEntries={vi.fn()}
      />
    );
    expect(screen.getByTestId('tab-nlp')).toBeInTheDocument();
    expect(screen.getByTestId('tab-manual')).toBeInTheDocument();
    expect(screen.getByTestId('tab-photo')).toBeInTheDocument();
    expect(screen.getByTestId('tab-barcode')).toBeInTheDocument();
    expect(screen.getByTestId('tab-templates')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AddFoodModal
        open={false}
        onClose={() => {}}
        meal="breakfast"
        onAddEntry={vi.fn()}
        onAddEntries={vi.fn()}
      />
    );
    expect(screen.queryByTestId('tab-manual')).toBeNull();
  });
});
