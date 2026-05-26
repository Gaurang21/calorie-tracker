import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test('profile page persists edits', async ({ page }) => {
  await signupAndOnboard(page, { email: 'profile@example.com' });
  await page.goto('/profile');
  const name = page.getByLabel('Name');
  await name.fill('Renamed');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await expect(page.getByLabel('Name')).toHaveValue('Renamed');
});

test('profile shows computed metrics', async ({ page }) => {
  await signupAndOnboard(page, { email: 'metrics@example.com' });
  await page.goto('/profile');
  await expect(page.getByText('BMR')).toBeVisible();
  await expect(page.getByText('TDEE')).toBeVisible();
  await expect(page.getByText('BMI')).toBeVisible();
});
