// Ztráta smaragdů za chyby (Ondřej 20. 10. 2026)
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('dvě chyby zdarma s varováním, další stojí smaragd; na konci kola hra řekne kolik', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999, emeralds: 10 });
  await playRound(page, 'Písmena', { wrong: 4 });
  const s = await saved(page), e = s.log.at(-1);
  expect(e.lost).toBe(2);
  const said = await page.evaluate(() => window.__said.join(' | '));
  expect(said).toContain('Pozor, další chyba už bude stát smaragd');
  expect(said).toContain('Smaragd je pryč');
  await expect.poll(() => page.evaluate(() => window.__said.join(' | '))).toContain('Za chyby jsi ztratil 2 smaragdy');
  await expect(page.locator('#endGems')).toContainText('za chyby −2');
});

test('bez smaragdů se nic nebere a nejde do minusu', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999, emeralds: 0 });
  await playRound(page, 'Písmena', { wrong: 5 });
  const s = await saved(page);
  expect(s.emeralds).toBeGreaterThanOrEqual(0);
});
