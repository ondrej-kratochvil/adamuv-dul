// Číslo verze hry (Ondřej 20. 10. 2026: Adam rád sleduje čísla verzí Minecraftu)
import { test, expect } from '@playwright/test';
import { openGame } from './helpers.js';

test('úvodní obrazovka ukazuje číslo verze a klepnutí ho přečte', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  const v = await page.evaluate(async () => (await (await fetch('version.json')).json()).version);
  const b = page.locator('#btnVersion');
  await expect(b).toHaveText(`v${v}`, { useInnerText: true }); // na mobilu krátce („v47“), hlas říká celé
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

// Ondřej 21. 10. 2026: na mobilu se hlavička vleze na jeden řádek („v47 Ondra“) a verze je stejně vysoká jako řada dní
for (const width of [360, 412]) {
  test(`hlavička na mobilu (${width} px) je na jednom řádku`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openGame(page, { total: 3, seenVersion: 999, emeralds: 265, streak: { count: 12, best: 12, last: '', totem: 0, days: [] } });
    await page.evaluate(() => { localStorage.setItem('adamuv-dul-v1:o1', localStorage.getItem('adamuv-dul-v1')); localStorage.setItem('adamuv-dul-profily', JSON.stringify({ active: 'o1', list: [{ id: 'adam', name: 'Adam' }, { id: 'o1', name: 'Ondra' }] })); });
    await page.reload();
    await expect(page.locator('#profileBadge')).toHaveText('Ondra', { useInnerText: true });
    const boxes = {};
    for (const id of ['homeGems', 'btnStreak', 'btnVersion', 'profileBadge', 'btnSettings']) boxes[id] = await page.locator('#' + id).boundingBox();
    const mid = b => b.y + b.height / 2;
    for (const b of Object.values(boxes)) expect(Math.abs(mid(b) - mid(boxes.btnStreak))).toBeLessThan(4);
    expect(await page.locator('#profileBadge').evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true); // jméno se neořízne
    expect(Math.abs(boxes.btnVersion.height - boxes.btnStreak.height)).toBeLessThan(1);
    expect(boxes.btnSettings.x + boxes.btnSettings.width).toBeLessThanOrEqual(width);
    await page.locator('.home-top').screenshot({ path: `test-results/hlavicka-${width}.png` });
  });
}
