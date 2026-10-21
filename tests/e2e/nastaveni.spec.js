// Nastavení na kartách (Ondřej 21. 10. 2026: nastavení bylo dlouhé a nepřehledné)
import { test, expect } from '@playwright/test';
import { openGame, openSettings } from './helpers.js';

const TABS = { game: '#segCase', voice: '#pronList', family: '#noteText', progress: '#btnStats', profiles: '#profileName', sync: '#syncUrl' };

test('nastavení má karty, ukazuje vždy jen jednu a pamatuje si poslední', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page);
  await expect(page.locator('.set-tabs [role="tab"]')).toHaveCount(6);
  await expect(page.locator('.set-tabs [data-tab="game"]')).toHaveAttribute('aria-selected', 'true');
  for (const [tab, el] of Object.entries(TABS)) {
    await page.locator(`.set-tabs [data-tab="${tab}"]`).click();
    await expect(page.locator(el)).toBeVisible();
    for (const [other, el2] of Object.entries(TABS)) if (other !== tab) await expect(page.locator(el2)).toBeHidden();
  }
  await page.locator('#btnSetClose').click();
  await openSettings(page);
  await expect(page.locator('#syncUrl')).toBeVisible(); // naposledy otevřená karta Tabulka
});

test('karty se na úzkém mobilu vejdou bez vodorovného posouvání', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page);
  const tabs = page.locator('.set-tabs');
  expect(await tabs.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  for (const b of await page.locator('.set-tabs [role="tab"]').all()) expect(await b.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await page.locator('.set-tabs').screenshot({ path: 'test-results/nastaveni-karty.png' });
  await page.locator('#setOverlay .panel').screenshot({ path: 'test-results/nastaveni-hra.png' });
});
