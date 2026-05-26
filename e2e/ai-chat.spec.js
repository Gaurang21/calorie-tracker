import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test.describe('AI chat', () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, { email: 'chat@example.com' });
    await page.goto('/ai-chat');
  });

  test('page loads with starter questions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Chat' })).toBeVisible();
    await expect(page.getByTestId('chat-starters')).toBeVisible();
    await expect(page.getByText('How many calories did I average last week?')).toBeVisible();
  });

  test('sending a question shows user message and AI reply', async ({ page }) => {
    await page.getByTestId('chat-input').fill('How am I doing?');
    await page.getByTestId('chat-send').click();
    await expect(page.getByText('How am I doing?')).toBeVisible();
    await expect(page.getByText(/last 30 days/)).toBeVisible({ timeout: 10000 });
  });

  test('clicking a starter sends it', async ({ page }) => {
    await page.getByText('What\'s my weight trend?').click();
    await expect(page.getByText(/last 30 days/)).toBeVisible({ timeout: 10000 });
  });
});
