// Velká obrazovka počítače (Ondřej 21. 10. 2026): dlaždice vlevo, místa vpravo, nic nepřetéká
import { test, expect } from '@playwright/test';
import { openGame } from './helpers.js';
test.use({ isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

for (const [w, h] of [[1920, 1080], [1366, 768]]) test(`počítač ${w} × ${h}: dlaždice vlevo, místa vpravo`, async ({ page }) => {
  await page.setViewportSize({ width: w, height: h });
  await openGame(page, { total: 30, seenVersion: 999 });
  const tiles = await page.locator('.tiles').boundingBox(), places = await page.locator('.places').boundingBox();
  expect(tiles.x + tiles.width).toBeLessThanOrEqual(places.x);
  expect(Math.abs(tiles.y - places.y)).toBeLessThan(20);
  const lefts = await page.locator('.tiles > .lvl').evaluateAll(els => [...new Set(els.map(e => Math.round(e.getBoundingClientRect().left)))]);
  expect(lefts.length).toBe(4);
  // nápisy na dlaždicích se vejdou do kostky
  const over = await page.locator('.tiles .glyph').evaluateAll(els => els.filter(g => g.scrollWidth > g.closest('.plate').clientWidth + 1).length);
  expect(over).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
