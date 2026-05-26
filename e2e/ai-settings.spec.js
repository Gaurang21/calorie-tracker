import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('AI settings section renders and toggles persist', async ({ page }) => {
  await signupAndOnboard(page, { email: 'aiset@example.com' });
  await page.goto('/settings');

  await expect(page.getByTestId('ai-settings')).toBeVisible();
  await expect(page.getByTestId('ollama-url')).toBeVisible();
  await expect(page.getByTestId('ollama-key')).toBeVisible();

  // Toggle a feature off and reload to confirm it persisted.
  await page.getByTestId('flag-meal_suggestions').uncheck();
  await page.reload();
  await expect(page.getByTestId('flag-meal_suggestions')).not.toBeChecked();
});

test('Test connection button shows disconnected status for placeholder values', async ({ page }) => {
  await signupAndOnboard(page, { email: 'conntest@example.com' });
  await page.goto('/settings');
  // No URL/key entered → connection test should report disconnected.
  await page.getByTestId('test-connection').click();
  await expect(page.getByTestId('conn-status')).toContainText(/Disconnected/);
});
