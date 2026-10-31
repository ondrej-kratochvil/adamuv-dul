// Přenos hráče QR kódem (Ondřej 31. 10. 2026): ukázat, načíst fotoaparátem, otevřít hru z naskenované adresy.
// Fotoaparát a čtení QR napodobí init skript (BarcodeDetector vrátí připravený text).
import { test, expect } from '@playwright/test';
import { openGame, openSettings } from './helpers.js';

const CODE = '0f8fad5b-d9cb-469f-a165-70867728950e.' + 'ab'.repeat(32);
const fakeCamera = code => {
  navigator.mediaDevices.getUserMedia = async () => { const ms = new MediaStream(); ms.getTracks = () => [{ stop() { window.__camStopped = true; } }]; return ms; };
  HTMLMediaElement.prototype.play = async function () {};
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { get: () => 640 });
  window.BarcodeDetector = class { async detect() { return [{ rawValue: `https://schoolcraft.games/#kod=${code}` }]; } };
};

test('karta Online: QR kód hráče se ukáže', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999, cloud: { on: true, id: CODE.split('.')[0], secret: CODE.split('.')[1], last: Date.now(), queue: [], error: '', pub: true, nick: 'Adam' } });
  await openSettings(page, 'online');
  await page.locator('#btnCloudQr').click();
  await expect(page.locator('#cloudQrBox')).toBeVisible();
  expect(await page.locator('#cloudQr').evaluate(c => c.width)).toBeGreaterThan(150);
});

test('načtení QR kódu fotoaparátem vyplní kód a nabídne nahrazení postupu', async ({ page }) => {
  await page.addInitScript(fakeCamera, CODE);
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'online');
  await page.locator('#btnCloudScan').click();
  await expect(page.locator('#cloudRestoreConfirm')).toBeVisible();
  await expect(page.locator('#cloudCode')).toHaveValue(CODE);
  await expect(page.locator('#scanOverlay')).toBeHidden();
  expect(await page.evaluate(() => window.__camStopped)).toBe(true);
});

test('nové zařízení otevřené z QR adresy stáhne hráče (kód se z adresy hned smaže)', async ({ page }) => {
  await openGame(page, { total: 42, seenVersion: 999, emeralds: 77 });
  const remote = await page.evaluate(() => JSON.parse(JSON.stringify(window.__adam.save)));
  await page.route(/schoolcraft\.games\/api\/me\/save/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ nick: 'Adam', save: remote, updated: 1 }) }));
  await page.evaluate(() => localStorage.clear());
  await page.goto(`./?qr=1#kod=${CODE}`); // jiná adresa než teď: jen změna # by stránku znovu nenačetla
  await expect(page.locator('#codeOverlay')).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe('');
  await page.locator('#btnCodeYes').click();
  await page.waitForLoadState('load');
  await expect.poll(() => page.evaluate(() => window.__adam && window.__adam.save.total)).toBe(42);
  await expect(page.locator('#setupOverlay')).toBeHidden();
});

test('na zařízení, kde už někdo hraje, chce QR adresa zámek pro rodiče a pak nabídne nahrazení', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999 });
  await page.goto(`./?qr=1#kod=${CODE}`); // jiná adresa než teď: jen změna # by stránku znovu nenačetla
  await expect(page.locator('#gateOverlay')).toBeVisible();
  const [a, b] = (await page.locator('#gateQ').textContent()).split(' × ').map(Number);
  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('#btnGateOk').click();
  await expect(page.locator('#cloudRestoreConfirm')).toBeVisible();
  await expect(page.locator('#cloudCode')).toHaveValue(CODE);
});
