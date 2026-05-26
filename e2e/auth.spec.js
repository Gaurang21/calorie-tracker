import { test, expect } from '@playwright/test';

test.describe('auth', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('unauthenticated visit to /log redirects to /login', async ({ page }) => {
    await page.goto('/log');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signup form validates mismatched passwords', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password1');
    await page.getByLabel('Confirm password').fill('password2');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByTestId('auth-error')).toContainText(/do not match/i);
  });

  test('signup form requires password length', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('123');
    await page.getByLabel('Confirm password').fill('123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByTestId('auth-error')).toContainText(/at least 6/i);
  });

  test('login form shows an error with invalid credentials (placeholder backend)', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    // Placeholder Supabase URL will fail the request; auth-error should appear.
    await expect(page.getByTestId('auth-error')).toBeVisible({ timeout: 15000 });
  });

  test('link to signup from login works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('reset password page renders', async ({ page }) => {
    await page.goto('/reset');
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  });
});
