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
