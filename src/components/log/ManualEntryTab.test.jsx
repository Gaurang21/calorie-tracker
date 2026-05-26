import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManualEntryTab from './ManualEntryTab.jsx';

// user=null so the autocomplete-fetch useEffect is skipped — keeps the test deterministic in jsdom.
vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: () => ({}) },
}));

describe('ManualEntryTab', () => {
  let onSave;
  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined);
  });

  it('renders required fields', () => {
    render(<ManualEntryTab meal="breakfast" onSave={onSave} />);
    expect(screen.getByLabelText(/food name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/protein/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/carbs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fat/i)).toBeInTheDocument();
  });

  it('shows error when name is missing', async () => {
    render(<ManualEntryTab meal="breakfast" onSave={onSave} />);
    const form = document.querySelector('form');
    form.noValidate = true;
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByTestId('form-error')).toHaveTextContent(/name is required/i));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits the correct data shape on save', async () => {
    render(<ManualEntryTab meal="lunch" onSave={onSave} />);
    fireEvent.change(screen.getByTestId('food-name'), { target: { value: 'Oatmeal' } });
    fireEvent.change(screen.getByTestId('calories'), { target: { value: '320' } });
    fireEvent.change(screen.getByLabelText(/protein/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/carbs/i), { target: { value: '54' } });
    fireEvent.change(screen.getByLabelText(/fat/i), { target: { value: '6' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      meal: 'lunch',
      name: 'Oatmeal',
      calories: 320,
      protein_g: 10,
      carbs_g: 54,
      fat_g: 6,
      source: 'manual',
    });
  });
});
