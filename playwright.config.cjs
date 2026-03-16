// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Run the app with `npm run build && npx vite preview --port 4173` or use webServer.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4174/bigquery-calc/',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4174',
    url: 'http://localhost:4174/bigquery-calc/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
