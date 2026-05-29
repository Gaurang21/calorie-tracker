import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test.describe('dashboard', () => {
  test('loads without errors and shows greeting', async ({ page }) => {
    await signupAndOnboard(page, { email: 'dash@example.com' });
    await expect(page.getByText(/Alex/)).toBeVisible();
    await expect(page.getByText(/kcal left/i).first()).toBeVisible();
    await expect(page.getByText('Macros')).toBeVisible();
    await expect(page.getByText('Hydration')).toBeVisible();
    await expect(page.getByText('Net calories')).toBeVisible();
  });

  test('quick-add FAB navigates to log page', async ({ page }) => {
    await signupAndOnboard(page, { email: 'fab@example.com' });
    await page.getByRole('button', { name: /log food/i }).click();
    await expect(page).toHaveURL(/\/log$/);
  });
});
