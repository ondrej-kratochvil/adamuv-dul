// Ranní karta a dnešní úkol (Ondřej 22. 10. 2026).
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('při prvním otevření dne řekne den, datum, svátek a úkol; podruhé už ne', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-22T07:30:00+02:00'));
  await openGame(page, { total: 3, seenVersion: 999 }, { day: true });
  await expect(page.locator('#dayOverlay')).toBeVisible();
  await expect(page.locator('#dayTitle')).toHaveText('Čtvrtek 22. října');
  await expect(page.locator('#dayNames')).toHaveText('Svátek má Sabina.');
  await expect(page.locator('#dayQuest')).toContainText('Dnešní úkol: Zahraj');
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Dobré ráno, Adame! Dnes je čtvrtek dvacátého druhého října. Svátek má Sabina. Dnešní úkol:');
  // klepnutí na kartu ji přečte znovu
  const n = await page.evaluate(() => window.__said.length);
  await page.locator('#dayTitle').click();
  await expect.poll(() => page.evaluate(() => window.__said.length)).toBeGreaterThan(n);
  await page.locator('#btnDayLater').click();
  await expect(page.locator('#dayOverlay')).toBeHidden();
  await expect(page.locator('#questStrip')).toContainText('Dnešní úkol');
  await page.reload();
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('#dayOverlay')).toBeHidden();
  // proužek na úvodní obrazovce kartu otevře znovu
  await page.locator('#questStrip').click();
  await expect(page.locator('#dayOverlay')).toBeVisible();
});

test('tlačítko na kartě otevře patro a splněný úkol dá 5 smaragdů', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-22T15:00:00+02:00'));
  const quest = { kind: 'rounds', level: 'letters', need: 2, got: 1, done: false };
  await openGame(page, { total: 3, seenVersion: 999, emeralds: 10, daily: { d: '2026-10-22', quest, shown: false } }, { day: true });
  await expect(page.locator('#btnDayGo')).toHaveText('Hrát Písmena');
  await page.locator('#btnDayGo').click();
  await expect(page.locator('#game')).toBeVisible();
  await playRound(page, null);
  await expect(page.locator('#endGems')).toContainText('5 za dnešní úkol');
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Splnil jsi dnešní úkol! Bonus 5 smaragdů.');
  expect((await saved(page)).daily.quest).toMatchObject({ got: 2, done: true });
  // druhé povedené kolo už bonus nedá
  const gems = (await saved(page)).emeralds;
  await page.locator('#btnAgain').click();
  await playRound(page, null);
  await expect(page.locator('#endGems')).not.toContainText('za dnešní úkol');
  expect((await saved(page)).emeralds - gems).toBeLessThan(15);
});

test('půlnoc při otevřené hře: ráno přijde nová karta', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T23:58:00+02:00') });
  await openGame(page, { total: 3, seenVersion: 999, daily: { d: '2026-10-21', quest: { kind: 'rounds', level: 'math', need: 2, got: 0, done: false }, shown: true } }, { day: true });
  await expect(page.locator('#dayOverlay')).toBeHidden();
  await page.clock.fastForward('03:00');
  await expect(page.locator('#dayOverlay')).toBeVisible();
  await expect(page.locator('#dayTitle')).toHaveText('Čtvrtek 22. října');
  expect((await saved(page)).daily.d).toBe('2026-10-22');
});

test('po aktualizaci: nejdřív novinky, karta až po Rozumím (Ondřej 24. 10. 2026)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-24T07:30:00+02:00'));
  await openGame(page, { total: 3, seenVersion: 50 }, { day: true });
  await expect(page.locator('.update')).toContainText('Co je nového');
  await page.waitForTimeout(500);
  await expect(page.locator('#dayOverlay')).toBeHidden();
  await expect(page.locator('#questStrip')).toHaveCount(0); // úkol vybere až nová verze
  await page.locator('.update .gbtn.go').click(); // Rozumím
  await expect(page.locator('#dayOverlay')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('Dnes je sobota dvacátého čtvrtého října');
});

test('čeká novější verze: karta se neukáže, dokud se hra neaktualizuje', async ({ page }) => {
  await page.route(/version.json/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 999, changes: [{ version: 999, date: '2026-10-24', notes: ['Test.'] }] }) }));
  await page.clock.setFixedTime(new Date('2026-10-24T07:30:00+02:00'));
  await openGame(page, { total: 3, seenVersion: 999 }, { day: true });
  await expect(page.locator('.update')).toContainText('Je tu nová');
  await page.waitForTimeout(500);
  await expect(page.locator('#dayOverlay')).toBeHidden();
});

test('zvířátka: v Rodině zamčená; splněný dnešní úkol odemkne první (had Sunny)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-25T15:00:00+02:00'));
  const quest = { kind: 'rounds', level: 'letters', need: 1, got: 0, done: false };
  await openGame(page, { total: 3, seenVersion: 999, daily: { d: '2026-10-25', quest, shown: true } });
  await page.getByRole('button', { name: 'Rodina', exact: true }).click();
  await expect(page.locator('#famItems')).toContainText('Zvířátka (0 z 11)');
  await expect(page.locator('#famItems .pet-item.locked')).toHaveCount(11);
  await page.locator('#btnFamBack').click();
  await playRound(page, 'Písmena');
  await expect(page.locator('#newPet')).toContainText('Nové zvířátko v Rodině: Sunny!');
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('A v Rodině přibylo zvířátko: Sunny, had, užovka červená. Bydlí u vás doma.');
  expect((await saved(page)).questsDone).toBe(1);
  await page.locator('#btnEndHome').click();
  await page.getByRole('button', { name: 'Rodina', exact: true }).click();
  await expect(page.locator('#famItems')).toContainText('Zvířátka (1 z 11)');
  await page.locator('#famItems .pet-item').first().click();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('Sunny, had, užovka červená');
  await page.locator('#famItems .pet-item.locked').first().click();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('přijde, až splníš dnešní úkol');
});

test('zvířátka v řadě rodiny za majitelem; Adam převleče Mourka a stejná čepice pro babičku je další kus', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999, questsDone: 5, emeralds: 30 });
  await page.getByRole('button', { name: 'Rodina', exact: true }).click();
  const names = await page.locator('#famPeople .fam-pick').evaluateAll(els => els.map(e => e.getAttribute('aria-label')));
  expect(names.slice(names.indexOf('táta Ondra'), names.indexOf('táta Ondra') + 4)).toEqual(['táta Ondra', 'Sunny', 'Žofinka', 'bílé myšky']);
  expect(names.slice(names.indexOf('babička Iva'), names.indexOf('babička Iva') + 3)).toEqual(['babička Iva', 'Mourek', 'Argo']);
  expect(names).not.toContain('Karel'); // ještě zamčený
  await page.getByRole('button', { name: 'Mourek', exact: true }).first().click();
  await expect(page.locator('#famName')).toContainText('Mourek');
  const cap = page.getByRole('button', { name: 'čepice s bambulí', exact: true });
  await cap.click(); await cap.click();
  expect((await saved(page)).famWear).toEqual({ 'pet:mourek': { head: 'cepice' } });
  await page.getByRole('button', { name: 'babička Iva', exact: true }).click();
  await cap.click();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('už někdo nosí');
});
