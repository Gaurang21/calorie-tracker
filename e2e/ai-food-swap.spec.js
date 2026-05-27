import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('Swap button opens sheet with 3 suggestions and Log Instead replaces the entry', async ({ page }) => {
  await signupAndOnboard(page, { email: 'swap@example.com' });
  await page.goto('/log');

  // Add a baseline food to swap from.
  await page.getByTestId('add-lunch').click();
  await page.getByTestId('food-name').fill('Pizza slice');
  await page.getByTestId('calories').fill('300');
  await page.getByRole('button', { name: /^save$/i }).click();

  const lunch = page.getByTestId('meal-lunch');
  await expect(lunch.getByText('Pizza slice')).toBeVisible();

  await lunch.getByRole('button', { name: /suggest swaps for pizza slice/i }).click();
  await expect(page.getByTestId('swap-list')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('swap-list').locator('> div')).toHaveCount(3);

  // Log first swap
  await page.getByTestId('swap-0').click();
  await expect(lunch.getByText('Pizza slice')).toHaveCount(0);
  await expect(lunch.getByText('Grilled chicken breast')).toBeVisible();
});
