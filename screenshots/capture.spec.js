// Captures screenshots of every page with sample data for manual review.
// Not part of the regular test suite — run with: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test screenshots
import { test, expect } from '@playwright/test';
import { signupAndOnboard, clearState } from '../e2e/helpers.js';
import path from 'node:path';

const OUT = path.resolve('screenshots/out');

async function seedDay(page) {
  // Log a few foods, an activity, and water so the dashboard is non-empty.
  await page.goto('/log');
  for (const [meal, name, kcal, p, c, f] of [
    ['breakfast', 'Oatmeal & banana', 350, 9, 60, 6],
    ['breakfast', 'Coffee with oat milk', 70, 1, 8, 3],
    ['lunch', 'Grilled chicken bowl', 540, 42, 50, 14],
    ['dinner', 'Salmon, rice, broccoli', 620, 38, 55, 24],
    ['snacks', 'Greek yogurt + berries', 210, 18, 22, 4],
  ]) {
    await page.getByTestId(`add-${meal}`).click();
    await page.getByTestId('food-name').fill(name);
    await page.getByTestId('calories').fill(String(kcal));
    await page.getByLabel(/protein/i).fill(String(p));
    await page.getByLabel(/carbs/i).fill(String(c));
    await page.getByLabel(/fat/i).fill(String(f));
    await page.getByRole('button', { name: /^save$/i }).click();
  }
  // Activity
  await page.getByTestId('add-activity').click();
  await page.getByRole('button', { name: /🏃 Running/ }).click();
  await page.getByTestId('duration').fill('30');
  await page.getByRole('button', { name: /^save$/i }).click();
  // Water
  await page.getByRole('button', { name: '+500ml' }).click();
  await page.getByRole('button', { name: '+500ml' }).click();
  await page.getByRole('button', { name: '+250ml' }).click();
}

async function seedWeek(page) {
  // Add food on Monday..Wed so weekly summary shows.
  const today = new Date();
  const dayIdx = today.getDay();
  const mondayOffset = dayIdx === 0 ? -6 : 1 - dayIdx;
  const monday = new Date(today); monday.setDate(today.getDate() + mondayOffset);
  const dates = [0, 1, 2].map((i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  await page.goto('/log');
  for (const iso of dates) {
    if (iso === new Date().toISOString().slice(0, 10)) continue; // today already seeded
    await page.getByTestId('log-date').fill(iso);
    await page.getByTestId('add-breakfast').click();
    await page.getByTestId('food-name').fill(`Breakfast ${iso}`);
    await page.getByTestId('calories').fill('500');
    await page.getByRole('button', { name: /^save$/i }).click();
  }
  // Seed weight history for trends + projection
  await page.goto('/profile');
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dateInput = page.getByRole('textbox').filter({ has: page.locator('xpath=ancestor::section//div[contains(., "Weight history")]') }).first().or(page.locator('input[type=date]').nth(2));
    await page.locator('input[type=date]').last().fill(iso);
    await page.locator('input[placeholder="kg"]').fill(String(80 - i * 0.2));
    await page.getByRole('button', { name: 'Add' }).click();
  }
}

test.describe.serial('screenshots', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('capture all pages (light mode)', async ({ page }) => {
    await signupAndOnboard(page, { email: 'shots@example.com' });
    await seedDay(page);
    await seedWeek(page);

    // Dashboard with data
    await page.goto('/');
    // Generate weekly summary so card has content
    if (await page.getByTestId('weekly-generate').isVisible().catch(() => false)) {
      await page.getByTestId('weekly-generate').click();
      await expect(page.getByText(/Great week/)).toBeVisible({ timeout: 10000 });
    }
    // Generate meal suggestions
    if (await page.getByTestId('meal-suggest-btn').isVisible().catch(() => false)) {
      await page.getByTestId('meal-suggest-btn').click();
      await expect(page.getByTestId('meal-suggestions-list')).toBeVisible({ timeout: 10000 });
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/01-dashboard.png`, fullPage: true });

    // Log page
    await page.goto('/log');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/02-log.png`, fullPage: true });

    // Add Food modal — show NLP tab with results
    await page.goto('/log');
    await page.getByTestId('add-breakfast').click();
    await page.getByTestId('tab-nlp').click();
    await page.getByTestId('nlp-input').fill('I had a bowl of oatmeal with banana and a coffee with oat milk');
    await page.getByTestId('nlp-parse').click();
    await expect(page.getByTestId('nlp-results')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/03-add-food-nlp.png`, fullPage: true });
    await page.keyboard.press('Escape');

    // Food swap sheet
    await page.goto('/log');
    const lunch = page.getByTestId('meal-lunch');
    await lunch.getByRole('button', { name: /suggest swaps/i }).first().click();
    await expect(page.getByTestId('swap-list')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/04-food-swap.png`, fullPage: true });
    await page.keyboard.press('Escape');

    // Trends
    await page.goto('/trends');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/05-trends.png`, fullPage: true });

    // AI Chat
    await page.goto('/ai-chat');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/06-ai-chat-empty.png`, fullPage: true });
    await page.getByTestId('chat-input').fill('How am I doing this week?');
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(/last 30 days/)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/07-ai-chat-reply.png`, fullPage: true });

    // Profile
    await page.goto('/profile');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/08-profile.png`, fullPage: true });

    // Settings (incl AI section)
    await page.goto('/settings');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/09-settings.png`, fullPage: true });

    // Dark mode dashboard
    await page.getByTestId('dark-mode-toggle').check();
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/10-dashboard-dark.png`, fullPage: true });
  });

  test('capture auth pages', async ({ page }) => {
    await clearState(page);
    await page.goto('/login');
    await page.screenshot({ path: `${OUT}/11-login.png` });
    await page.goto('/signup');
    await page.screenshot({ path: `${OUT}/12-signup.png` });
    await page.goto('/reset');
    await page.screenshot({ path: `${OUT}/13-reset.png` });
  });

  test('capture onboarding', async ({ page }) => {
    await clearState(page);
    await page.goto('/signup');
    await page.getByLabel('Email').fill('onboard-shot@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password1');
    await page.getByLabel('Confirm password').fill('password1');
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL(/\/onboarding$/);
    await page.screenshot({ path: `${OUT}/14-onboarding-step1.png` });
    await page.getByLabel('Name').fill('Alex');
    await page.getByRole('button', { name: 'Male', exact: true }).click();
    await page.getByLabel('Date of birth').fill('1990-01-01');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.screenshot({ path: `${OUT}/15-onboarding-step2.png` });
  });

  test('mobile viewport sample', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await signupAndOnboard(page, { email: 'mobile@example.com' });
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/16-mobile-dashboard.png`, fullPage: true });
    await page.goto('/log');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/17-mobile-log.png`, fullPage: true });
    await ctx.close();
  });
});
