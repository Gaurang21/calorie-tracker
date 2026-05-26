import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test.describe('activity log', () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, { email: 'act@example.com' });
    await page.goto('/log');
  });

  test('opens activity modal and auto-calculates calories from MET × weight × duration', async ({ page }) => {
    await page.getByTestId('add-activity').click();
    await page.getByRole('button', { name: /🏃 Running/ }).click();
    await page.getByTestId('duration').fill('30');
    // 9.8 * 80 * 0.5 = 392
    await expect(page.getByTestId('calories-burned')).toHaveValue('392');
  });

  test('saving activity updates net calories', async ({ page }) => {
    // Eat 500 kcal
    await page.getByTestId('add-breakfast').click();
    await page.getByTestId('food-name').fill('Oatmeal');
    await page.getByTestId('calories').fill('500');
    await page.getByRole('button', { name: /^save$/i }).click();

    await page.getByTestId('add-activity').click();
    await page.getByRole('button', { name: /🚶 Walking/ }).click();
    await page.getByTestId('duration').fill('30');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Walking MET 3.5 * 80 * 0.5 = 140
    await expect(page.getByTestId('activity-section')).toContainText('140 kcal');
    await expect(page.getByTestId('net-calories')).toContainText('360'); // 500 - 140
  });
});
