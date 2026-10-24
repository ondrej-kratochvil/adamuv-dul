// Stupně obtížnosti podle zvládnutí (Ondřej 24. 10. 2026): co se nově otevře, hra po povedeném kole řekne a ukáže
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('po kole, ve kterém Adam zvládne 70 % samohlásek, se otevřou dlouhá písmena a hra to oznámí', async ({ page }) => {
  const good = { ok: 3, miss: 0, n: 3 }, almost = { ok: 2, miss: 0, n: 2 };
  await openGame(page, { total: 5, seenVersion: 999, stats: { 'letters:A': good, 'letters:E': good, 'letters:I': good, 'letters:O': almost, 'letters:U': almost } });
  expect((await saved(page)).stages.letters || 0).toBe(0); // při startu ještě 3 z 5, tedy pod 70 %
  await playRound(page, 'Písmena');
  await expect(page.locator('#newStage')).toBeVisible();
  await expect(page.locator('#newStage')).toContainText('dlouhá písmena');
  await expect.poll(() => page.evaluate(() => window.__said.join(' | '))).toContain('Novinka!');
  expect((await saved(page)).stages.letters).toBe(1);
});

test('starší postup se při startu zařadí podle toho, co Adam umí, bez oznámení', async ({ page }) => {
  const good = { ok: 3, miss: 0, n: 3 };
  const stats = Object.fromEntries([...Array(21).keys()].map(n => ['numbers:' + n, good]));
  await openGame(page, { total: 5, seenVersion: 999, stats });
  expect((await saved(page)).stages.numbers).toBe(2); // do 10 i do 20 zvládnuto = čísla do 50
});
