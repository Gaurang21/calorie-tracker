import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 120000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'VITE_E2E=1 npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
