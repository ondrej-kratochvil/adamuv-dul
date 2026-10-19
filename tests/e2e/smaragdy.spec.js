// Smaragdy nemají strop a trojmístný počet se vejde do lišty.
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('přes 99 smaragdů se počítá dál a počet je celý vidět', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 860 });
  await openGame(page, { total: 3, emeralds: 98 });
  await playRound(page, 'Písmena');
  const s = await saved(page);
  expect(s.emeralds).toBeGreaterThan(99);
  await page.locator('#btnAgain').click();
  const hud = page.locator('#hudGems');
  await expect(hud).toContainText(String(s.emeralds));
  const fits = await hud.evaluate(el => el.scrollWidth <= el.clientWidth + 1);
  expect(fits).toBe(true);
  await page.locator('#btnBack').click();
  await expect(page.locator('#homeGems')).toContainText(String(s.emeralds));
});
