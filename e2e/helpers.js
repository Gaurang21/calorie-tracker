// Shared helpers for E2E tests.
// All tests run against the dev server with VITE_E2E=1, so Supabase is
// replaced by a localStorage-backed fake (see src/lib/supabaseFake.js).

export async function clearState(page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('e2e_supabase_state');
    localStorage.removeItem('e2e_supabase_session');
  });
}

// Sign up a new user via the UI and complete onboarding.
export async function signupAndOnboard(page, { email = 'tester@example.com', password = 'password1' } = {}) {
  await clearState(page);
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL(/\/onboarding$/);

  // Step 1
  await page.getByLabel('Name').fill('Alex');
  await page.getByRole('button', { name: 'Male', exact: true }).click();
  await page.getByLabel('Date of birth').fill('1990-01-01');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 2
  await page.getByLabel('Height (cm)').fill('180');
  await page.getByLabel('Current weight (kg)').fill('80');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 3
  await page.getByRole('button', { name: /moderately active/i }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 4
  await page.getByLabel('Target weight (kg)').fill('75');
  await page.getByRole('button', { name: 'Finish', exact: true }).click();

  await page.waitForURL((url) => url.pathname === '/');
}

// Quick programmatic sign-in that bypasses signup (uses the fake auth).
export async function signInAs(page, email = 'tester@example.com', password = 'password1') {
  await clearState(page);
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/onboarding');
}
