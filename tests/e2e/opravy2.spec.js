// Regresní testy k druhému review 19. 10. 2026.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

const said = page => page.evaluate(() => window.__said.join(' '));

test('nepovedené kolo po hotové farmě neslibuje růst farmy', async ({ page }) => {
  await openGame(page, { total: 30 });
  await playRound(page, 'Písmena', { wrong: 8 });
  await expect(page.locator('#endTitle')).toHaveText('Skoro!');
  await expect(page.locator('#endLine')).not.toContainText('Farma vyroste');
  await expect.poll(() => said(page)).toContain('Tentokrát se kolo nezapočítalo');
});

test('dostavění domu ohlásí, že je Stavění otevřené', async ({ page }) => {
  await openGame(page, { total: 11 });
  await playRound(page, 'Písmena');
  await expect.poll(() => said(page)).toContain('Stavění je otevřené.');
  await expect(page.locator('#endBlocks')).toContainText('čekají ve Stavění');
});

test('před dostavěním domu karta konce kola řekne, že se kostky schovávají', async ({ page }) => {
  await openGame(page, { total: 2 });
  await playRound(page, 'Písmena');
  await expect(page.locator('#endBlocks')).toContainText('schovávám na Stavění');
});

test('kostky z rozehraného kola se po odchodu neztratí', async ({ page }) => {
  await openGame(page, { total: 2 });
  await page.getByRole('button', { name: 'Písmena', exact: true }).click();
  await expect.poll(() => page.evaluate(() => { const r = window.__adam.R; if (r && !r.busy && !r.stuck && r.els) r.els[r.choices.indexOf(r.target)].click(); return r ? r.i : -1; }), { timeout: 20000 }).toBeGreaterThanOrEqual(3);
  await page.locator('#btnBack').click();
  expect((await saved(page)).build.blocks.dirt).toBeGreaterThanOrEqual(3);
});

test('klepnutí na trávu postaví kostku na zem', async ({ page }) => {
  await openGame(page, { total: 12, build: { blocks: { stone: 2 }, placed: {} } });
  await page.getByRole('button', { name: 'Stavění', exact: true }).click();
  const cv = page.locator('#buildBig'), box = await cv.boundingBox();
  await cv.click({ position: { x: 5.5 * box.width / 16, y: 9.5 * box.height / 11 } }); // tráva
  await cv.click({ position: { x: 5.5 * box.width / 16, y: 10.5 * box.height / 11 } }); // hlína
  expect((await saved(page)).build.placed).toEqual({ '5,8': 'stone', '5,7': 'stone' });
});

test('plocha stavění se vejde i na nízkou obrazovku', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 420 });
  await openGame(page, { total: 12, build: { blocks: { stone: 1 }, placed: {} } });
  await page.getByRole('button', { name: 'Stavění', exact: true }).click();
  await page.waitForTimeout(300);
  await expect(page.locator('#buildBig')).toBeInViewport({ ratio: 1 });
});

test('zálohu jde vrátit a vrácení jde vrátit zpátky', async ({ page }) => {
  await openGame(page, { total: 20, emeralds: 50 });
  await openSettings(page);
  await expect(page.locator('#btnRestore')).toBeHidden();
  await page.locator('#btnReset').click();
  await page.locator('#btnResetYes').click();
  await expect(page.locator('#btnRestore')).toBeVisible();
  await page.locator('#btnRestore').click();
  await expect(page.locator('#restoreInfo')).toContainText('20 povedených kol');
  await page.locator('#btnRestoreYes').click();
  expect(await saved(page)).toMatchObject({ total: 20, emeralds: 50 });
  const backup = await page.evaluate(() => JSON.parse(localStorage.getItem('adamuv-dul-zaloha')));
  expect(backup.total).toBe(0);
});

test('ozubené kolo řekne, že nastavení je pro rodiče', async ({ page }) => {
  await openGame(page);
  await page.locator('#btnSettings').click();
  await expect.poll(() => said(page)).toContain('nastavení pro rodiče');
  await expect(page.locator('#setOverlay')).toBeHidden();
});

test('nepovedené 12. kolo neříká, že kostky čekají ve Stavění (review 3)', async ({ page }) => {
  await openGame(page, { total: 11 });
  await playRound(page, 'Písmena', { wrong: 8 });
  await expect(page.locator('#endTitle')).toHaveText('Skoro!');
  await expect(page.locator('#endBlocks')).toContainText('schovávám na Stavění');
});

test('začít od začátku nechá výslovnost vybranou rodičem (review 4)', async ({ page }) => {
  await openGame(page, { total: 20, pron: { SO: 'plain', LY: 'letters' } });
  await openSettings(page);
  await page.locator('#btnReset').click();
  await page.locator('#btnResetYes').click();
  const s = await saved(page);
  expect(s.total).toBe(0);
  expect(s.pron).toEqual({ SO: 'plain', LY: 'letters' });
});
