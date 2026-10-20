// Číslo verze hry (Ondřej 20. 10. 2026: Adam rád sleduje čísla verzí Minecraftu)
import { test, expect } from '@playwright/test';
import { openGame } from './helpers.js';

test('úvodní obrazovka ukazuje číslo verze a klepnutí ho přečte', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  const v = await page.evaluate(async () => (await (await fetch('version.json')).json()).version);
  const b = page.locator('#btnVersion');
  await expect(b).toHaveText(`verze ${v}`);
  await b.click();
  await expect.poll(() => page.evaluate(() => window.__said.join(' | '))).toContain(`Hra má číslo verze ${v}.`);
});

test('novinky z více verzí: od nejstarší, každá s číslem verze', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  const v = await page.evaluate(async () => (await (await fetch('version.json')).json()).version);
  await page.evaluate(([k, sv]) => { const s = JSON.parse(localStorage.getItem(k)); s.seenVersion = sv; localStorage.setItem(k, JSON.stringify(s)); }, ['adamuv-dul-v1', v - 2]);
  await page.reload();
  const items = page.locator('.update li');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).locator('.ver-n')).toHaveText(String(v - 1));
  await expect(items.nth(1).locator('.ver-n')).toHaveText(String(v));
  await expect(page.locator('.update b').first()).toContainText(`verze ${v}`);
  await page.locator('.home-top').screenshot({ path: 'test-results/verze.png' });
});
