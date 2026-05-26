import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('barcode scanner tab renders with manual lookup fallback', async ({ page }) => {
  await signupAndOnboard(page, { email: 'bar@example.com' });
  await page.goto('/log');
  await page.getByTestId('add-snacks').click();
  await page.getByTestId('tab-barcode').click();
  await expect(page.getByPlaceholder('Or enter barcode')).toBeVisible();
  await expect(page.getByRole('button', { name: /start camera scan/i })).toBeVisible();
});
