import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test.describe('NLP food logging', () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, { email: 'nlp@example.com' });
    await page.goto('/log');
    await page.getByTestId('add-breakfast').click();
  });

  test('Describe It tab is visible as first tab', async ({ page }) => {
    await expect(page.getByTestId('tab-nlp')).toBeVisible();
  });

  test('parsing input shows AI results and Log All Items', async ({ page }) => {
    await page.getByTestId('tab-nlp').click();
    await page.getByTestId('nlp-input').fill('I had a bowl of oatmeal with banana and a coffee with oat milk');
    await page.getByTestId('nlp-parse').click();
    await expect(page.getByTestId('nlp-results')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('nlp-log-all')).toBeVisible();
  });

  test('Log All Items adds parsed items to breakfast', async ({ page }) => {
    await page.getByTestId('tab-nlp').click();
    await page.getByTestId('nlp-input').fill('oatmeal and coffee');
    await page.getByTestId('nlp-parse').click();
    await expect(page.getByTestId('nlp-results')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('nlp-log-all').click();
    const breakfast = page.getByTestId('meal-breakfast');
    await expect(breakfast.getByText(/Oatmeal/)).toBeVisible();
    await expect(breakfast.getByText(/Coffee/)).toBeVisible();
  });
});
