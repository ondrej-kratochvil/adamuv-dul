// Pauza v kole (Ondřej 20. 10. 2026): zadání se schová, čas stojí, pauza se odliší od odchodu
import { test, expect } from '@playwright/test';
import { openGame, saved } from './helpers.js';

async function answer(page) {
  return page.evaluate(() => { const r = window.__adam.R; if (!r || r.busy || r.stuck || r.paused || !r.els) return false; r.els[r.choices.indexOf(r.target)].click(); return true; });
}

test('pauza schová kostky, klepnutí nic nedělá a po Pokračovat kolo běží dál; pauza je v deníku', async ({ page }) => {
  await openGame(page, { total: 3 });
  await page.getByRole('button', { name: 'Písmena', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!(window.__adam.R && window.__adam.R.els && !window.__adam.R.busy))).toBe(true);
  await page.locator('#btnPause').click();
  await expect(page.locator('#pauseOverlay')).toBeVisible();
  await expect(page.locator('#blocks')).toBeHidden(); // visibility: hidden
  expect(await answer(page)).toBe(false);
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Pokračovat' }).click();
  await expect(page.locator('#pauseOverlay')).toBeHidden();
  await expect(page.locator('#blocks')).toBeVisible();
  for (let k = 0; k < 400 && !(await page.locator('#endOverlay').isVisible()); k++) { await answer(page); await page.waitForTimeout(40); }
  await expect(page.locator('#endOverlay')).toBeVisible();
  const e = (await saved(page)).log.at(-1);
  expect(e.quit).toBe(false);
  expect(e.pauses).toBe(1);
  expect(e.pauseSecs).toBeGreaterThanOrEqual(1);
});

test('pauza během chvály po správné odpovědi: po pokračování přijde další úkol', async ({ page }) => {
  await openGame(page, { total: 3 });
  await page.getByRole('button', { name: 'Písmena', exact: true }).click();
  // klepat, dokud se kostka nerozbije (krumpáč může potřebovat víc ran)
  await expect.poll(async () => { await answer(page); return page.evaluate(() => window.__adam.R.i); }).toBe(1);
  await page.locator('#btnPause').click(); // kostka se právě rozbila, hra chválí
  await page.waitForTimeout(800);
  await page.locator('#btnResume').click();
  await expect.poll(() => page.evaluate(() => { const r = window.__adam.R; return !!(r.els && !r.busy && r.i === 1); })).toBe(true);
});
