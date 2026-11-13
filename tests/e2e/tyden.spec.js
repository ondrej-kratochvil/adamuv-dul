// Týdenní souhrn pro rodiče (Ondřej 11. 11. 2026): karta Týden v nastavení, Poslat rodině, pondělní věta na ranní kartě.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

test('po povedeném kole je v kartě Týden den hraní a nově zvládnuté úlohy; Poslat rodině pošle text', async ({ page }) => {
  await page.addInitScript(() => { navigator.share = async d => { window.__shared = d.text; }; });
  // písmeno A má za sebou 2 správné odpovědi: třetí v kole ho udělá zvládnutým
  await openGame(page, { player: 'adam', gameName: 'Adamův důl', seenVersion: 999, total: 3, stats: { 'letters:A': { ok: 2, miss: 0, n: 2 }, 'letters:E': { ok: 2, miss: 0, n: 2 } } });
  await playRound(page, 'Písmena');
  await page.locator('#btnEndHome').click();
  const got = (await saved(page)).got;
  expect(Object.keys(got).length).toBeGreaterThan(0);
  await openSettings(page, 'week');
  await expect(page.locator('#weekNow')).toContainText('1 ze 7 dní');
  await expect(page.locator('#weekNow')).toContainText('Nově zvládnuté');
  await expect(page.locator('#weekNow')).toContainText('Písmena');
  await page.locator('#btnWeekShare').click();
  await expect(page.locator('#weekMsg')).toHaveText('Posláno.');
  expect(await page.evaluate(() => window.__shared)).toMatch(/^Schoolcraft, týden .*: Adam hrál/);
});

test('v pondělí ranní karta řekne, jak se dařilo minulý týden', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 16, 7, 30)); // pondělí 16. 11.
  const t = d => new Date(2026, 10, d, 17).getTime();
  const log = [9, 10, 12].map(d => ({ t: t(d), d: '', level: 'letters', clean: 6, done: 6, len: 6, ok: true, quit: false, secs: 60 }));
  await openGame(page, { player: 'adam', gameName: 'Adamův důl', seenVersion: 999, total: 3, log, got: { 'letters:A': t(10), 'letters:E': t(12) } }, { day: true });
  await expect(page.locator('#dayOverlay')).toBeVisible();
  await expect(page.locator('#dayWeek')).toHaveText('Minulý týden jsi hrál 3 dny a naučil ses 2 nové věci. Tento týden to zkusíme ještě o den víc?');
  await expect(page.locator('#dayOverlay')).toHaveAttribute('data-say', /Minulý týden jsi hrál 3 dny/);
});
