import { test, expect } from '@playwright/test';
import { signupAndOnboard } from './helpers.js';
import path from 'node:path';
import fs from 'node:fs';

test('photo upload UI displays stub AI result', async ({ page }) => {
  await signupAndOnboard(page, { email: 'photo@example.com' });
  await page.goto('/log');
  await page.getByTestId('add-breakfast').click();
  await page.getByTestId('tab-photo').click();

  // Tiny in-memory PNG
  const tmp = path.join('/tmp', 'meal.png');
  // 1x1 transparent PNG
  const png = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6300010000000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
  fs.writeFileSync(tmp, png);
  await page.setInputFiles('input[type=file]', tmp);

  await page.getByRole('button', { name: /analyze with ai/i }).click();
  await expect(page.getByTestId('ai-result')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/approximate/i)).toBeVisible();
});
