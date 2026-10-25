import { defineConfig, devices } from '@playwright/test';

// testy běží proti sestavené hře (stejné soubory jako na GitHub Pages)
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  retries: 1, // jedno opakování: lokálně kvůli Avastu, na GitHubu kvůli sdíleným strojům; opakovaný test se hlásí jako „flaky“
  // lokálně 2 prohlížeče: Avast na Ondřejově počítači zadrhává víc souběžných spojení na 127.0.0.1;
  // GitHub má 4 jádra a výchozí by byla polovina (25. 10. 2026: testy tam trvaly 4,5 minuty)
  workers: process.env.CI ? 4 : 2,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173/', ...devices['Pixel 7'], browserName: 'chromium', locale: 'cs-CZ', timezoneId: 'Europe/Prague' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://127.0.0.1:4173/', reuseExistingServer: false /* vždy čerstvé sestavení: přerušený běh jinak nechá starý server a testy by zkoušely starou hru */, timeout: 120_000 },
});
