// Regresní testy k chybám z review 19. 10. 2026: každá oprava má test, aby se chyba nevrátila.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

test('vesnice se nebourá: postavená škola zůstane i po nových chybách', async ({ page }) => {
  await openGame(page, { total: 25, village: { letters: 8 }, stats: { 'letters:A': { ok: 3, miss: 2, n: 5 } } });
  await page.getByRole('button', { name: 'Vesnice', exact: true }).click();
  await expect(page.locator('#villageCap')).toContainText('Hotových budov: 1 z 7');
});

test('po hotové farmě se už nic neslibuje a tlačítko pod obrázkem otevře farmu', async ({ page }) => {
  await openGame(page, { total: 23 });
  await playRound(page, 'Písmena');
  await expect(page.locator('#endLine')).not.toContainText('brzy přijde');
  await expect(page.locator('#btnEndHouse')).toHaveText('Farma');
  await page.locator('#btnEndHouse').click();
  await expect(page.locator('#farm')).toBeVisible();
  await expect(page.locator('#farmCap')).not.toContainText(/brzy přijde/i);
});

test('na konci kola v době stavby domu vede tlačítko do domu', async ({ page }) => {
  await openGame(page, { total: 3 });
  await playRound(page, 'Písmena');
  await expect(page.locator('#btnEndHouse')).toHaveText('Můj dům');
});

test('přísnost platí i pro psaní: přísná nedovolí ani jednu chybu z 5', async ({ page }) => {
  await openGame(page, { strict: 'strict' });
  await playRound(page, 'Psaní', { wrong: 1 });
  await expect(page.locator('#endTitle')).toHaveText('Skoro!');
});

test('střední přísnost v psaní dovolí jednu chybu z 5', async ({ page }) => {
  await openGame(page, { strict: 'normal' });
  await playRound(page, 'Psaní', { wrong: 1 });
  await expect(page.locator('#endTitle')).toHaveText('Výborně, Adame!');
});

test('nastavení se krátkým klepnutím neotevře, podržením ano', async ({ page }) => {
  await openGame(page);
  await page.locator('#btnSettings').click();
  await page.waitForTimeout(300);
  await expect(page.locator('#setOverlay')).toBeHidden();
  await openSettings(page);
});

test('začít od začátku řekne, co všechno se smaže, a nechá zálohu', async ({ page }) => {
  await openGame(page, { total: 20, emeralds: 50 });
  await openSettings(page);
  await page.locator('#btnReset').click();
  await expect(page.locator('#resetConfirm')).toContainText('smaragdy');
  await expect(page.locator('#resetConfirm')).toContainText('záloha');
  await page.locator('#btnResetYes').click();
  expect((await saved(page)).total).toBe(0);
  const backup = await page.evaluate(() => JSON.parse(localStorage.getItem('adamuv-dul-zaloha')));
  expect(backup.emeralds).toBe(50);
});

test('vzkaz se skloňuje správně', async ({ page }) => {
  await openGame(page, { notes: [{ who: 'paja', text: 'Jsem na tebe pyšná!', done: false }, { who: 'tom', text: 'Ahoj Adame!', done: false }] });
  await playRound(page, 'Písmena');
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Vzkaz od mámy Páji: Jsem na tebe pyšná!');
  await page.locator('#btnAgain').click();
  await expect(page.locator('#endOverlay')).toBeHidden();
  await page.locator('#btnBack').click();
  await playRound(page, 'Písmena');
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Vzkaz od kamaráda Toma: Ahoj Adame!');
});

test('postup jde přenést na jiný tablet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openGame(page, { total: 17, emeralds: 42, dogName: 'Lola' });
  await openSettings(page);
  await page.locator('#btnExport').click();
  const text = await page.locator('#transferText').inputValue();
  expect(text).toMatch(/^ADAMUV-DUL-POSTUP:/);
  // druhý „tablet“: čistá hra
  const p2 = await context.newPage();
  await openGame(p2);
  await openSettings(p2);
  await p2.locator('#btnImport').click();
  await p2.locator('#transferText').fill(text);
  await expect(p2.locator('#importInfo')).toContainText('17 povedených kol');
  await p2.locator('#btnImportYes').click();
  expect((await saved(p2))).toMatchObject({ total: 17, emeralds: 42, dogName: 'Lola' });
});
