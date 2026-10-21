// Profily hráčů: testování bez zásahu do Adamova postupu (Ondřej 20. 10. 2026)
import { test, expect } from '@playwright/test';
import { KEY, openGame, openSettings, playRound } from './helpers.js';

const adam = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);

test('testovací profil s kopií postupu: hraní nemění Adamův postup, návrat na Adama', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999, emeralds: 33, sync: { url: 'https://script.google.com/macros/s/A/exec', queue: [], last: 0, sent: 10, error: '', seq: 0, device: 'tablet', uid: 'ab12' } });
  await openSettings(page, 'profiles');
  await page.locator('#profileName').fill('Test');
  await page.locator('#profileCopy').check();
  await page.locator('#btnProfileNew').click();
  await page.waitForLoadState('load');
  await expect(page.locator('#profileBadge')).toHaveText('Profil: Test');
  const prof = await page.evaluate(() => window.__adam.save);
  expect(prof.emeralds).toBe(33);
  expect(prof.sync.url).toBe(''); // kopie neposílá do tabulky
  await playRound(page, 'Písmena');
  const a = await adam(page);
  expect(a.total).toBe(5);
  expect(a.emeralds).toBe(33);
  await page.locator('#btnEndHome').click();
  await openSettings(page, 'profiles');
  await page.locator('#profileList .profile-row').filter({ hasText: 'Adam' }).getByRole('button', { name: 'Přepnout' }).click();
  await page.waitForLoadState('load');
  await expect(page.locator('#profileBadge')).toBeHidden();
  expect(await page.evaluate(() => window.__adam.save.total)).toBe(5);
});

test('nový profil od začátku a jeho smazání', async ({ page }) => {
  await openGame(page, { total: 12, seenVersion: 999, emeralds: 50 });
  await openSettings(page, 'profiles');
  await page.locator('#profileName').fill('Víťa');
  await page.locator('#btnProfileNew').click();
  await page.waitForLoadState('load');
  await expect(page.locator('#profileBadge')).toHaveText('Profil: Víťa');
  expect(await page.evaluate(() => window.__adam.save.total)).toBe(0);
  await openSettings(page, 'profiles');
  const row = page.locator('#profileList .profile-row').filter({ hasText: 'Víťa' });
  await row.getByRole('button', { name: 'Smazat' }).click();
  await row.getByRole('button', { name: 'Opravdu smazat?' }).click();
  await page.waitForLoadState('load');
  await expect(page.locator('#profileBadge')).toBeHidden();
  expect(await page.evaluate(() => window.__adam.save.total)).toBe(12);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('adamuv-dul-v1:')).length)).toBe(0);
});

// Ondřej 21. 10. 2026: v kopii profilu „Ondra“ to vypadalo, že se adresa smazala; po jejím zadání kopie poslala
// znovu Adamova stará kola (bez sloupce Profil) a přepsala list „Stav mobil táty“
test('kopie profilu: vysvětlí, proč nemá adresu, nepošle znovu zkopírovaná kola a má vlastní list Stav', async ({ page }) => {
  const URL = 'https://script.google.com/macros/s/PROF/exec', got = [];
  await page.route(URL, async route => { got.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true }) }); });
  await openGame(page, { total: 5, seenVersion: 999, log: [{ t: Date.now() - 86400000, d: '2026-10-19', level: 'numbers', clean: 8, done: 8, len: 8, ok: true, quit: false, secs: 44 }],
    sync: { url: URL, queue: [], last: 0, sent: 10, error: '', seq: 0, device: 'mobil táty', uid: 'ab12', backfilled: true } });
  await openSettings(page, 'profiles');
  await page.locator('#profileName').fill('Ondra');
  await page.locator('#profileCopy').check();
  await page.locator('#btnProfileNew').click();
  await page.waitForLoadState('load');
  await openSettings(page, 'sync');
  await expect(page.locator('#syncInfo')).toContainText('pro každý profil zvlášť');
  await page.locator('#syncUrl').fill(URL);
  await page.locator('#btnSyncSave').click();
  await expect(page.locator('#backfillConfirm')).toBeHidden();
  await page.locator('#btnSetClose').click();
  await playRound(page, 'Písmena');
  await page.locator('#btnEndHome').click();
  await expect.poll(() => got.flatMap(b => b.rows).filter(r => r.Druh === 'kolo').length).toBe(1);
  const kola = got.flatMap(b => b.rows).filter(r => r.Druh === 'kolo');
  expect(kola[0]).toMatchObject({ Patro: 'Písmena', Profil: 'Ondra' });
  expect(got.at(-1).stav.zarizeni).toBe('mobil táty (Ondra)');
});
