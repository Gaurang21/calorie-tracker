import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('water quick-add buttons update progress', async ({ page }) => {
  await signupAndOnboard(page, { email: 'water@example.com' });
  await page.goto('/log');
  await page.getByRole('button', { name: '+250ml' }).click();
  await page.getByRole('button', { name: '+500ml' }).click();
  await expect(page.locator('text=750ml /')).toBeVisible();
});
