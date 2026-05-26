import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('trends page loads with all chart cards and date range filter', async ({ page }) => {
  await signupAndOnboard(page, { email: 'trends@example.com' });
  await page.goto('/trends');
  await expect(page.getByRole('heading', { name: 'Trends' })).toBeVisible();
  await expect(page.getByText('Weight history')).toBeVisible();
  await expect(page.getByText('Calories vs target')).toBeVisible();
  await expect(page.getByText('Macro distribution')).toBeVisible();
  await expect(page.getByText('Net calories')).toBeVisible();
  await expect(page.getByText('Goal projection')).toBeVisible();

  // Date range filter
  await page.locator('select').selectOption('7');
  await expect(page.locator('select')).toHaveValue('7');
});
