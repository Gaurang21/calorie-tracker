import { test, expect } from '@playwright/test';
import { clearState, signupAndOnboard } from './helpers.js';

test.describe('onboarding', () => {
  test('new signup is redirected to onboarding', async ({ page }) => {
    await clearState(page);
    await page.goto('/signup');
    await page.getByLabel('Email').fill('new@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password1');
    await page.getByLabel('Confirm password').fill('password1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test('Next is disabled until required fields are filled in step 1', async ({ page }) => {
    await clearState(page);
    await page.goto('/signup');
    await page.getByLabel('Email').fill('next@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password1');
    await page.getByLabel('Confirm password').fill('password1');
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL(/\/onboarding$/);
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await page.getByLabel('Name').fill('A');
    await page.getByRole('button', { name: 'Male', exact: true }).click();
    await page.getByLabel('Date of birth').fill('1990-01-01');
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  });

  test('completing all 4 steps lands on dashboard', async ({ page }) => {
    await signupAndOnboard(page, { email: 'finished@example.com' });
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.getByText(/Alex/)).toBeVisible();
  });
});
