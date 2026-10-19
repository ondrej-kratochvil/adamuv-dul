// Rozložení na mobilu a tabletu: nic nepřetéká, tlačítka na konci kola jsou vidět.
import { test, expect } from '@playwright/test';
import { openGame, playRound } from './helpers.js';

const SIZES = { 'mobil na výšku': [412, 860], 'tablet na výšku': [800, 1110], 'tablet na šířku': [1280, 690] };
for (const [name, [w, h]] of Object.entries(SIZES)) {
  test(`${name}: úvodní obrazovka bez vodorovného posunu`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openGame(page, { total: 30, emeralds: 99 });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(over).toBeLessThanOrEqual(0);
  });
  test(`${name}: konec kola má tlačítka na obrazovce`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openGame(page, { total: 11 });
    await playRound(page, 'Písmena');
    for (const id of ['btnAgain', 'btnEndHome']) await expect(page.locator('#' + id)).toBeInViewport();
  });
}

test('mobil: na konci kola je vidět celý dům a tři tlačítka vedle sebe', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 860 });
  await openGame(page, { total: 8 }); // 9. kolo = nový krumpáč, nejvíc obsahu na kartě
  await playRound(page, 'Písmena');
  await expect(page.locator('#newPick')).toBeVisible();
  await expect(page.locator('#endHouse')).toBeInViewport({ ratio: 1 });
  const tops = await page.locator('#endOverlay .actions .gbtn').evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await page.screenshot({ path: 'test-results/konec-kola.png' });
});
