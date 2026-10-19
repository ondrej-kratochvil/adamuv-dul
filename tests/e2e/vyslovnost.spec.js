// Výslovnost slabik: rodič vybere v nastavení variantu, hra ji použije.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

test('slabiky se čtou bez slova „Slabika“', async ({ page }) => {
  await openGame(page);
  await playRound(page, 'Slabiky');
  expect(await page.evaluate(() => window.__said.join(' | '))).not.toMatch(/Slabika/);
});

test('v nastavení jde u slabiky vybrat a poslechnout výslovnost', async ({ page }) => {
  await openGame(page);
  await openSettings(page);
  const row = page.locator('.pron-row', { hasText: /^so/ });
  await expect(row.locator('[aria-pressed="true"]')).toContainText('s písmeny');
  await row.locator('[data-mode="plain"]').click();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toBe('so');
  expect((await saved(page)).pron.SO).toBe('plain');
});
