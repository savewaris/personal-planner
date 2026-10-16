import { defineConfig, devices } from '@playwright/test';

// Dedicated port so tests never attach to another project's dev server on :3000.
const port = process.env.PLAYWRIGHT_PORT || '3100';
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/ui-ux',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI
      ? `npm run build && npm run start -- -p ${port}`
      : `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
