// Nastavení jako strom (Ondřej 31. 10. 2026: karet bylo moc): skupiny Hráč a rodina, Učení, Zařízení, Postup a data.
// Mobil: seznam, po výběru jen ta část se Zpět; od 900 px strom vlevo a část vpravo. Pamatuje si poslední část.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, settingsTab } from './helpers.js';

const PARTS = {
  player: '#plName', family: '#noteText', game: '#segCase', strict: '#segStrict', voice: '#pronList',
  push: '#btnPushOn', pass: '#passInfo', device: '#btnVibrate',
  progress: '#btnStats', profiles: '#profileName', online: '#cloudNick', sync: '#syncUrl',
};
const GROUPS = ['Hráč a rodina', 'Učení', 'Zařízení', 'Postup a data'];

test('mobil: po otevření seznam ve skupinách, vybraná část sama se Zpět, pamatuje si poslední', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page);
  for (const g of GROUPS) await expect(page.locator('.set-tree .set-group h3', { hasText: g })).toBeVisible();
  await expect(page.locator('.set-tree [data-tab]')).toHaveCount(Object.keys(PARTS).length);
  await expect(page.locator('#btnSetBack')).toBeHidden();
  for (const [tab, el] of Object.entries(PARTS)) {
    await settingsTab(page, tab);
    await expect(page.locator(el)).toBeVisible();
    await expect(page.locator('.set-tree')).toBeHidden();
    await expect(page.locator('#setTitle')).toHaveText(await page.locator(`.set-tree [data-tab="${tab}"]`).textContent());
    for (const [other, el2] of Object.entries(PARTS)) if (other !== tab) await expect(page.locator(el2)).toBeHidden();
  }
  await page.locator('#btnSetBack').click();
  await expect(page.locator('.set-tree')).toBeVisible();
  await expect(page.locator('.set-tree [data-tab="sync"]')).toHaveAttribute('aria-current', 'page'); // naposledy otevřená
  await expect(page.locator('#setTitle')).toHaveText('Pro rodiče');
  await page.locator('#btnSetClose').click();
  await openSettings(page);
  await expect(page.locator('.set-tree')).toBeVisible(); // na mobilu nejdřív seznam
  await page.locator('#setOverlay .panel').screenshot({ path: 'test-results/nastaveni-strom.png' });
});

test('počítač: strom vlevo a část vpravo zároveň, bez tlačítka Zpět; pamatuje si poslední část', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'online');
  await expect(page.locator('.set-tree')).toBeVisible();
  await expect(page.locator('#cloudNick')).toBeVisible();
  await expect(page.locator('#btnSetBack')).toBeHidden();
  const tree = await page.locator('.set-tree').boundingBox(), body = await page.locator('.set-body').boundingBox();
  expect(tree.x + tree.width).toBeLessThanOrEqual(body.x);
  await page.locator('#btnSetClose').click();
  await openSettings(page);
  await expect(page.locator('#cloudNick')).toBeVisible();
  await page.locator('#setOverlay .panel').screenshot({ path: 'test-results/nastaveni-pocitac.png' });
});

test('úzký mobil (360 px): položky stromu se vejdou bez vodorovného posouvání', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page);
  for (const b of await page.locator('.set-tree [data-tab]').all()) expect(await b.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
