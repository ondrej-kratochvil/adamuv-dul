import { defineConfig, devices } from '@playwright/test';

// testy běží proti sestavené hře (stejné soubory jako na GitHub Pages)
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  // lokálně nejvýš 3 prohlížeče: Avast na Ondřejově počítači zadrhává víc souběžných spojení na 127.0.0.1
  workers: process.env.CI ? undefined : 3,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173/', ...devices['Pixel 7'], browserName: 'chromium', locale: 'cs-CZ', timezoneId: 'Europe/Prague' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://127.0.0.1:4173/', reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
