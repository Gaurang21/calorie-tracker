import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';

test.describe('food log', () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, { email: 'food@example.com' });
    await page.goto('/log');
  });

  test('Add Food modal shows all 4 tabs', async ({ page }) => {
    await page.getByTestId('add-breakfast').click();
    await expect(page.getByTestId('tab-manual')).toBeVisible();
    await expect(page.getByTestId('tab-photo')).toBeVisible();
    await expect(page.getByTestId('tab-barcode')).toBeVisible();
    await expect(page.getByTestId('tab-templates')).toBeVisible();
  });

  test('manual entry adds item to meal section and updates totals', async ({ page }) => {
    await page.getByTestId('add-lunch').click();
    await page.getByTestId('food-name').fill('Apple');
    await page.getByTestId('calories').fill('95');
    await page.getByLabel(/protein/i).fill('0.5');
    await page.getByLabel(/carbs/i).fill('25');
    await page.getByLabel(/fat/i).fill('0.3');
    await page.getByRole('button', { name: /^save$/i }).click();

    const lunch = page.getByTestId('meal-lunch');
    await expect(lunch.getByText('Apple')).toBeVisible();
    await expect(lunch.getByText(/95 kcal/).first()).toBeVisible();

    await expect(page.getByTestId('net-calories')).toContainText('95');
  });

  test('delete button removes item from the log', async ({ page }) => {
    await page.getByTestId('add-dinner').click();
    await page.getByTestId('food-name').fill('Bread');
    await page.getByTestId('calories').fill('120');
    await page.getByRole('button', { name: /^save$/i }).click();

    const dinner = page.getByTestId('meal-dinner');
    await expect(dinner.getByText('Bread')).toBeVisible();
    await dinner.getByRole('button', { name: /delete bread/i }).click();
    await expect(dinner.getByText('Bread')).toHaveCount(0);
  });
});
