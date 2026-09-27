import { defineConfig, devices } from '@playwright/test';

/**
 * Live E2E configuration against actual backend target.
 * Requires owner-provided credentials and live server.
 */
export default defineConfig({
  testDir: './tests/e2e/live',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.KBASE_LIVE_BASE_URL || 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
