import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174/Final-player/',
    ...devices['Pixel 7'],
    viewport: { width: 390, height: 844 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [
    { name: 'portrait' },
    // the sideways table: two films are enough to catch layout-only breakage
    { name: 'landscape', use: { viewport: { width: 844, height: 390 } }, grep: /Happy Trails|Creech/ },
  ],
  webServer: {
    // Bind the loopback address explicitly so the server and Playwright agree on IPv4.
    command: 'npm run preview -- --port 4174 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4174/Final-player/',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
