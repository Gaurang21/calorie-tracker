import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('dark mode toggle persists', async ({ page }) => {
  await signupAndOnboard(page, { email: 'set1@example.com' });
  await page.goto('/settings');
  await page.getByTestId('dark-mode-toggle').check();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('units toggle switches between metric and imperial', async ({ page }) => {
  await signupAndOnboard(page, { email: 'set2@example.com' });
  await page.goto('/settings');
  await page.getByTestId('units-imperial').click();
  await page.reload();
  await expect(page.getByTestId('units-imperial')).toHaveClass(/shadow-\[0_6px_18px/);
});

test('Gemini API key field accepts input', async ({ page }) => {
  await signupAndOnboard(page, { email: 'set3@example.com' });
  await page.goto('/settings');
  await page.getByTestId('gemini-key').fill('test-key-xyz');
  await page.reload();
  await expect(page.getByTestId('gemini-key')).toHaveValue('test-key-xyz');
});
