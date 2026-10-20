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

test('mobil na výšku: úvodní obrazovka má 3 sloupce dlaždic', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 860 });
  await openGame(page);
  const lefts = await page.locator('#levels > .lvl').evaluateAll(els => [...new Set(els.map(e => Math.round(e.getBoundingClientRect().left)))]);
  expect(lefts.length).toBe(3);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(over).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/domu-3sloupce.png' });
});

test('tablet: dlaždice se nepřekrývají', async ({ page }) => {
  for (const [w, h] of [[800, 1110], [1280, 690]]) {
    await page.setViewportSize({ width: w, height: h });
    await openGame(page);
    const boxes = await page.locator('#levels > .lvl .blk').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.top]; }));
    for (const a of boxes) for (const b of boxes) if (a !== b && Math.abs(a[2] - b[2]) < 5 && a[0] < b[0]) expect(a[1]).toBeLessThanOrEqual(b[0]);
  }
});

test('tablet na výšku: náhledy míst stejně vysoké a nápis hned pod obrázkem (20. 10. 2026)', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1110 });
  await openGame(page, { total: 30 });
  const cards = await page.locator('.places .house-card').evaluateAll(cs => cs.map(c => {
    const cv = c.querySelector('canvas').getBoundingClientRect(), n = c.querySelector('.lvl-name').getBoundingClientRect();
    return { h: Math.round(cv.height), w: Math.round(cv.width), gap: Math.round(n.top - cv.bottom), wide: c.classList.contains('wide') };
  }));
  expect(cards.length).toBe(7);
  for (const c of cards) { expect(c.gap).toBeLessThan(20); expect(c.gap).toBeGreaterThan(0); }
  for (const c of cards.filter(c => !c.wide)) expect(Math.abs(c.h - cards[0].h)).toBeLessThanOrEqual(2);
  expect(cards.filter(c => c.wide).length).toBe(2);
  await page.screenshot({ path: 'test-results/domu-tablet.png', fullPage: true });
});
