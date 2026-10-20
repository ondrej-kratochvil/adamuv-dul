// Hlášky rodiny ve hře.
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('večer po kole připomene máma zuby a postel, jen jednou', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T20:10:00+02:00'));
  await openGame(page, { total: 3 });
  await playRound(page, 'Písmena');
  await expect(page.locator('#cheer')).toContainText('máma Pája');
  await expect(page.locator('#cheer')).toContainText('čistit zuby');
  expect((await saved(page)).momSaid).toEqual({ d: '2026-10-20', ids: ['spat'] });
});

test('pozdrav na úvodní obrazovce je vlastní věta', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('.fan .bubble')).toContainText(/Ahoj Adam|Dobré ráno, Adame/); // ranní pozdrav (Marcelka) do 9:00
  await expect(page.locator('.fan .bubble')).not.toContainText('Dneska ti fandí');
});

test('klepnutí na hlášku ji přehraje znovu', async ({ page }) => {
  await openGame(page, { total: 3 });
  await playRound(page, 'Písmena');
  const line = await page.locator('#cheer .bubble').innerText();
  const before = await page.evaluate(() => window.__said.length);
  await page.locator('#cheer .bubble').click();
  await expect.poll(() => page.evaluate(() => window.__said.length)).toBeGreaterThan(before);
  const last = await page.evaluate(() => window.__said.at(-1));
  expect(last).toContain(line.split('\n').at(-1).trim());
});

test('po kole zazní, co přibylo na domě', async ({ page }) => {
  await openGame(page, { total: 3 });
  await playRound(page, 'Písmena');
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Přibylo na domě');
});

test('večer po nepovedeném kole máma povzbudí, nechválí (review 4)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T18:10:00+02:00'));
  await openGame(page, { total: 3 });
  await playRound(page, 'Písmena', { wrong: 8 });
  await expect(page.locator('#endTitle')).toHaveText('Skoro!');
  await expect(page.locator('#cheer')).toContainText('Nevadí, broučku. Za chvíli je večeře');
  await expect(page.locator('#cheer')).not.toContainText('Paráda');
});
