// Funkce zařízení jako u nainstalované aplikace (Ondřej 31. 10. 2026): nezhasínání obrazovky v kole, vibrace,
// číslo na ikoně, sdílení obrázku, zkratky. Testovací prohlížeč je nemá všechny, napodobí je init skript.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

const fakeDevice = () => {
  window.__dev = { wake: 0, released: 0, vib: [], badge: [], shared: null };
  Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => { window.__dev.wake++; const l = { _r: [], addEventListener(t, f) { this._r.push(f); }, release: async () => { window.__dev.released++; } }; return l; } } });
  navigator.vibrate = p => { window.__dev.vib.push(p); return true; };
  navigator.setAppBadge = async n => { window.__dev.badge.push(n); };
  navigator.clearAppBadge = async () => { window.__dev.badge.push(0); };
  navigator.canShare = () => true;
  navigator.share = async d => { window.__dev.shared = { name: d.files[0].name, type: d.files[0].type, size: d.files[0].size, text: d.text }; };
};
const dev = page => page.evaluate(() => window.__dev);
// klepnout na špatnou kostku, až je úkol připravený
async function tapWrong(page) {
  await page.waitForFunction(() => { const R = window.__adam.R; return R && R.els && !R.busy && !R.stuck; });
  await page.evaluate(() => { const R = window.__adam.R; R.els[R.choices.findIndex(c => c !== R.target)].click(); });
}

test('v kole obrazovka nezhasne, po kole se zámek pustí; chyba a povedené kolo zavibrují', async ({ page }) => {
  await page.addInitScript(fakeDevice);
  await openGame(page, { total: 3, seenVersion: 999 });
  await page.getByRole('button', { name: 'Písmena', exact: true }).click();
  await expect.poll(async () => (await dev(page)).wake).toBe(1);
  // chyba: klepnout na špatnou kostku
  await tapWrong(page);
  await expect.poll(async () => (await dev(page)).vib).toContainEqual(60);
  await page.locator('#btnBack').click();
  await expect.poll(async () => (await dev(page)).released).toBeGreaterThanOrEqual(1);
  await playRound(page, 'Písmena');
  await expect.poll(async () => (await dev(page)).vib).toContainEqual([30, 60, 30]);
});

test('vibrace jde v nastavení vypnout', async ({ page }) => {
  await page.addInitScript(fakeDevice);
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'device');
  await expect(page.locator('#btnVibrate')).toHaveText('Vibrace: zapnuto');
  await page.locator('#btnVibrate').click();
  await expect(page.locator('#btnVibrate')).toHaveText('Vibrace: vypnuto');
  await page.locator('#btnSetClose').click();
  await page.evaluate(() => { window.__dev.vib = []; });
  await page.getByRole('button', { name: 'Písmena', exact: true }).click();
  await tapWrong(page);
  await page.waitForTimeout(300);
  expect((await dev(page)).vib).toEqual([]);
});

test('číslo na ikoně: 1, dokud dnešní úkol čeká', async ({ page }) => {
  await page.addInitScript(fakeDevice);
  await openGame(page, { total: 3, seenVersion: 999 });
  await expect.poll(async () => (await dev(page)).badge.at(-1)).toBe(1);
});

test('obrázek domu jde poslat (sdílení), jako PNG s větou pro rodinu', async ({ page }) => {
  await page.addInitScript(fakeDevice);
  await openGame(page, { total: 5, seenVersion: 999 });
  await page.evaluate(() => { document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'house'; }); });
  await page.locator('#house .share-btn').click();
  await expect.poll(async () => (await dev(page)).shared && (await dev(page)).shared.name).toBe('dum.png');
  const s = (await dev(page)).shared;
  expect(s.type).toBe('image/png');
  expect(s.size).toBeGreaterThan(100);
  expect(s.text).toMatch(/Schoolcraftu/);
});

test('zkratka z ikony „Procvičit“ otevře procvičování, když je otevřené', async ({ page }) => {
  const bad = { ok: 0, miss: 3, n: 3, bad: 3 };
  await openGame(page, { total: 5, seenVersion: 999, stats: { 'letters:A': bad, 'letters:E': bad, 'letters:I': bad, 'letters:O': bad } });
  await page.goto('./?go=procvicit');
  await expect(page.locator('#game')).toBeVisible();
  expect(await page.evaluate(() => window.__adam.R && window.__adam.R.level)).toBe('practice');
  expect(await page.evaluate(() => location.search)).toBe('');
  expect((await saved(page)).total).toBe(5);
});
