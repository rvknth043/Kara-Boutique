import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/qa/tests',
  fullyParallel: true,
  retries: 2,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  reporter: [
    ['html', { outputFolder: '../test-results/final-report/html', open: 'never' }],
    ['json', { outputFile: '../test-results/final-report/report.json' }],
    ['junit', { outputFile: '../test-results/final-report/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
