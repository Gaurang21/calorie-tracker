import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('meal suggestion card appears when calories remaining and shows 3 meals', async ({ page }) => {
  await signupAndOnboard(page, { email: 'meal@example.com' });
  await page.goto('/');
  await expect(page.getByTestId('meal-suggestions')).toBeVisible();
  await page.getByTestId('meal-suggest-btn').click();
  await expect(page.getByTestId('meal-suggestions-list')).toBeVisible({ timeout: 10000 });
  const list = page.getByTestId('meal-suggestions-list').locator('> div');
  await expect(list).toHaveCount(3);
});
