import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('weekly summary card generates and persists', async ({ page }) => {
  await signupAndOnboard(page, { email: 'weekly@example.com' });

  // Log food on 3 distinct dates within the current week (Mon..Sun) so the card renders.
  const today = new Date();
  const dayIdx = today.getDay();                  // 0=Sun
  const mondayOffset = dayIdx === 0 ? -6 : 1 - dayIdx;
  const monday = new Date(today); monday.setDate(today.getDate() + mondayOffset);
  const dates = [0, 1, 2].map((i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  await page.goto('/log');
  for (const iso of dates) {
    await page.getByTestId('log-date').fill(iso);
    await page.getByTestId('add-breakfast').click();
    await page.getByTestId('food-name').fill(`Meal ${iso}`);
    await page.getByTestId('calories').fill('500');
    await page.getByRole('button', { name: /^save$/i }).click();
  }

  await page.goto('/');
  await expect(page.getByTestId('weekly-summary')).toBeVisible();
  await page.getByTestId('weekly-generate').click();
  await expect(page.getByText(/Great week/)).toBeVisible({ timeout: 10000 });

  // Reload should keep the cached summary without showing the Generate button.
  await page.reload();
  await expect(page.getByText(/Great week/)).toBeVisible();
  await expect(page.getByTestId('weekly-generate')).toHaveCount(0);
});
