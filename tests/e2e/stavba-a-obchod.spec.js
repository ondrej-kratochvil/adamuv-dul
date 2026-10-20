// Stavění z vykopaných kostek a věci z Adamova světa v obchodě.
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('vykopané kostky přijdou do zásoby na stavění', async ({ page }) => {
  await openGame(page, { total: 2 });
  await playRound(page, 'Písmena');
  expect((await saved(page)).build.blocks.dirt).toBe(8);
});

test('stavění je zamčené do dostavěného domu', async ({ page }) => {
  await openGame(page, { total: 5 });
  await page.getByRole('button', { name: 'Stavění', exact: true }).click();
  await expect(page.locator('#build')).toBeHidden();
});

test('Adam položí kostku a krumpáčem ji vezme zpět', async ({ page }) => {
  await openGame(page, { total: 12, build: { blocks: { stone: 3 }, placed: {} } });
  await page.getByRole('button', { name: 'Stavění', exact: true }).click();
  await expect(page.locator('#build')).toBeVisible();
  const cv = page.locator('#buildBig'), box = await cv.boundingBox();
  const cell = (x, y) => ({ x: (x + .5) * box.width / 16, y: (y + .5) * box.height / 11 });
  await cv.click({ position: cell(2, 8) });
  await cv.click({ position: cell(2, 7) });
  let s = await saved(page);
  expect(s.build.placed).toEqual({ '2,8': 'stone', '2,7': 'stone' });
  expect(s.build.blocks.stone).toBe(1);
  await page.getByRole('button', { name: 'Krumpáč: vzít kostku zpět' }).click();
  await cv.click({ position: cell(2, 7) });
  s = await saved(page);
  expect(s.build.placed).toEqual({ '2,8': 'stone' });
  expect(s.build.blocks.stone).toBe(2);
});

test('tank a vojáček jdou koupit a stojí na farmě', async ({ page }) => {
  await openGame(page, { total: 25, emeralds: 40 });
  await page.getByRole('button', { name: 'Obchod', exact: true }).click();
  for (const name of ['tank', 'vojáček']) { const b = page.getByRole('button', { name, exact: true }); await b.click(); await b.click(); }
  const s = await saved(page);
  expect(s.decor).toEqual(['tank', 'vojacek']);
  expect(s.emeralds).toBe(3);
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Najdeš ho na farmě.');
  await page.locator('#btnShopBack').click();
  await page.getByRole('button', { name: 'Farma', exact: true }).click();
});

// vzácné věci: Adam měl po prvním dni všechny obyčejné věci a 140 smaragdů (20. 10. 2026)
const good = { ok: 3, miss: 0, n: 3 };
function stats(nMath, nNumbers) {
  const s = {};
  for (let i = 0; i < nMath; i++) s[`math:${i}+1`] = good;
  for (let i = 0; i <= nNumbers; i++) s[`numbers:${i}`] = good;
  return s;
}
test('vzácná věc je zamčená, dokud Adam nezvládne dost úkolů', async ({ page }) => {
  await openGame(page, { total: 25, emeralds: 200 });
  await page.getByRole('button', { name: 'Obchod', exact: true }).click();
  const lama = page.getByRole('button', { name: 'lama', exact: true });
  await expect(lama).toHaveClass(/locked/);
  await lama.click(); await lama.click();
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Odemkne se, až zvládneš ještě');
  expect((await saved(page)).emeralds).toBe(200);
});
test('se zvládnutými úkoly jde lama koupit a stojí na farmě; helikoptéra ještě ne', async ({ page }) => {
  await openGame(page, { total: 25, emeralds: 200, stats: stats(30, 20) });
  await page.getByRole('button', { name: 'Obchod', exact: true }).click();
  const lama = page.getByRole('button', { name: 'lama', exact: true });
  await lama.click(); await lama.click();
  const s = await saved(page);
  expect(s.decor).toEqual(['lama']);
  expect(s.emeralds).toBe(170);
  await expect(page.getByRole('button', { name: 'helikoptéra', exact: true })).toHaveClass(/locked/);
  await page.locator('#btnShopBack').click();
  await page.getByRole('button', { name: 'Farma', exact: true }).click();
  await page.screenshot({ path: 'test-results/farma-lama.png' });
});
