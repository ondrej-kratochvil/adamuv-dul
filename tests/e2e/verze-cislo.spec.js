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

// Hlavička na úvodní obrazovce (Ondřej 21. 10. 2026: na mobilu na jeden řádek „v47 Ondra“; 31. 10. 2026: vše stejně
// vysoké, jméno se nesmí oříznout ani s jiným písmem, test padal jen na jiném počítači)
async function openHome(page, width, { emeralds = 265, streak = 12, name = 'Ondra' } = {}) {
  await page.setViewportSize({ width, height: 800 });
  await openGame(page, { total: 3, seenVersion: 999, emeralds, streak: { count: streak, best: streak, last: '', totem: 0, days: [] } });
  if (name) {
    await page.evaluate(n => { localStorage.setItem('adamuv-dul-v1:o1', localStorage.getItem('adamuv-dul-v1')); localStorage.setItem('adamuv-dul-profily', JSON.stringify({ active: 'o1', list: [{ id: 'adam', name: 'Adam' }, { id: 'o1', name: n }] })); }, name);
    await page.reload();
  }
}
const IDS = ['btnStreak', 'btnVersion', 'profileBadge', 'homeGems', 'btnSettings'];
// jeden řádek: stejná výška a střed, zleva doprava bez překryvu, nic mimo obrazovku, žádný text oříznutý
async function checkRow(page, width) {
  const boxes = [];
  for (const id of IDS) { const l = page.locator('#' + id); if (await l.isVisible()) boxes.push({ id, b: await l.boundingBox(), clip: await l.evaluate(e => e.scrollWidth > e.clientWidth + 1) }); }
  const h = boxes.find(x => x.id === 'btnSettings').b.height, mid = x => x.b.y + x.b.height / 2, m0 = mid(boxes[0]);
  for (const x of boxes) {
    expect(Math.abs(x.b.height - h), `${x.id} výška`).toBeLessThanOrEqual(1);
    expect(Math.abs(mid(x) - m0), `${x.id} střed`).toBeLessThanOrEqual(2);
    expect(x.b.x, `${x.id} vlevo`).toBeGreaterThanOrEqual(0);
    expect(x.b.x + x.b.width, `${x.id} vpravo`).toBeLessThanOrEqual(width);
    expect(x.clip, `${x.id} oříznutý text`).toBe(false);
  }
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].b.x, `${boxes[i].id} za ${boxes[i - 1].id}`).toBeGreaterThanOrEqual(boxes[i - 1].b.x + boxes[i - 1].b.width - .5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const width of [360, 390, 412]) {
  test(`hlavička na mobilu (${width} px) je na jednom řádku, jen jméno profilu a krátká verze`, async ({ page }) => {
    await openHome(page, width);
    await expect(page.locator('#profileBadge')).toHaveText('Ondra', { useInnerText: true });
    await expect(page.locator('#btnVersion')).toHaveText(/^v\d+$/, { useInnerText: true });
    await checkRow(page, width);
    await page.locator('.home-top').screenshot({ path: `test-results/hlavicka-${width}.png` });
  });
}
test('hlavička na mobilu s Adamovým profilem (bez štítku profilu)', async ({ page }) => {
  await openHome(page, 360, { name: '' });
  await expect(page.locator('#profileBadge')).toBeHidden();
  await checkRow(page, 360);
});
test('hlavička na mobilu s velkými čísly a delším jménem', async ({ page }) => {
  await openHome(page, 412, { emeralds: 1234, streak: 120, name: 'Kryštof' });
  await expect(page.locator('#profileBadge')).toHaveText('Kryštof', { useInnerText: true });
  await expect(page.locator('#homeGems')).toContainText('1234');
  await checkRow(page, 412);
});
test('hlavička na tabletu: celé „verze“ a „Profil:“', async ({ page }) => {
  await openHome(page, 800);
  await expect(page.locator('#btnVersion')).toHaveText(/^verze \d+$/, { useInnerText: true });
  await expect(page.locator('#profileBadge')).toHaveText('Profil: Ondra', { useInnerText: true });
  for (const id of IDS) { const b = await page.locator('#' + id).boundingBox(); expect(b.x + b.width).toBeLessThanOrEqual(800); }
});
