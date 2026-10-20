// Verze 27 (Ondřej 20. 10. 2026): doba a záměny u úloh, Procvičování, ukazatel zvládnutí, tabulka Google.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

const good = { ok: 3, miss: 0, n: 3 };
const WEAK = { 'reading:MÍSA': { ok: 2, miss: 3, bad: 5, n: 7 }, 'syllables:LÍ': { ok: 2, miss: 2, bad: 2, n: 4 }, 'numbers:68': { ok: 0, miss: 1, bad: 1, n: 1 }, 'letters:A': good };

test('dlaždice pater ukazují, kolik je zvládnuto', async ({ page }) => {
  await openGame(page, { total: 5, stats: { 'letters:A': good, 'letters:E': good, 'letters:M': { ok: 1, miss: 0, n: 1 } } });
  const tile = page.getByRole('button', { name: 'Písmena', exact: true });
  await expect(tile.locator('.lvl-sub')).toHaveText(/^2 z \d+$/);
});

test('Procvičit je zamčené, dokud není co procvičovat', async ({ page }) => {
  await openGame(page, { total: 5, stats: { 'letters:A': good } });
  await page.getByRole('button', { name: 'Procvičit', exact: true }).click();
  await expect(page.locator('#game')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toContain('Procvičování se otevře');
});

test('kolo Procvičování dává jen slabé úlohy a počítá se jako kolo', async ({ page }) => {
  await openGame(page, { total: 5, stats: WEAK });
  const seen = new Set(), counts = {}, taskIdx = new Set(); // klepnutí krumpáčem na jednu úlohu může být víc
  page.on('console', () => {});
  await page.getByRole('button', { name: 'Procvičit', exact: true }).click();
  const end = page.locator('#endOverlay');
  for (let k = 0; k < 400 && !(await end.isVisible()); k++) {
    const got = await page.evaluate(() => { const r = window.__adam.R; if (!r || r.busy || r.stuck || !r.els) return null; const i = r.choices.indexOf(r.target); const out = [r.statKey, r.i]; r.els[i].click(); return out; });
    if (got) { const [key, idx] = got; seen.add(key); if (!taskIdx.has(idx)) { taskIdx.add(idx); counts[key] = (counts[key] || 0) + 1; } }
    await page.waitForTimeout(40);
  }
  await expect(end).toBeVisible();
  // všechny slabé úlohy přijdou; každá nejvýš 2× za kolo, zbytek kola jsou běžné úlohy ze stejných pater
  for (const k of ['reading:MÍSA', 'syllables:LÍ', 'numbers:68']) expect(seen.has(k), k).toBe(true);
  expect([...seen].every(k => /^(reading|syllables|numbers):/.test(k))).toBe(true);
  for (const k of ['reading:MÍSA', 'syllables:LÍ', 'numbers:68']) expect(counts[k], k).toBeLessThanOrEqual(2);
  const s = await saved(page);
  expect(s.practice).toBe(1);
  expect(s.total).toBe(6);
  expect(s.stats['reading:MÍSA'].tn).toBeGreaterThan(0); // doba řešení se měří
});

test('chyba se zapíše jako záměna a Statistiky ji ukážou', async ({ page }) => {
  await openGame(page, { total: 5 });
  await playRound(page, 'Písmena', { wrong: 2 });
  const s = await saved(page);
  const conf = Object.entries(s.stats).filter(([, v]) => v.conf);
  expect(conf.length).toBeGreaterThan(0);
  await page.locator('#btnEndHome').click();
  await openSettings(page);
  await page.locator('#btnStats').click();
  await expect(page.locator('#statsBody')).toContainText('Plete si:');
  await expect(page.locator('#statsBody')).toContainText('Co procvičit');
});

test('tabulka Google: po nastavení adresy odejdou dřívější kola i nové úlohy, fronta se vyprázdní', async ({ page }) => {
  const URL = 'https://script.google.com/macros/s/TEST123/exec';
  const got = [];
  await page.route(URL, async route => { const b = JSON.parse(route.request().postData()); got.push(b); await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true }) }); });
  await openGame(page, { total: 5, log: [{ t: Date.now() - 86400000, d: '2026-10-19', level: 'numbers', clean: 8, done: 8, len: 8, ok: true, quit: false, secs: 44, rate: 8 }] });
  await playRound(page, 'Písmena');
  await page.locator('#btnEndHome').click();
  expect((await saved(page)).sync.queue.length).toBeGreaterThan(8); // bez adresy čeká ve frontě
  await openSettings(page);
  await page.locator('#syncUrl').fill('https://example.com/x');
  await page.locator('#btnSyncSave').click();
  await expect(page.locator('#syncInfo')).toContainText('Tohle není adresa');
  await page.locator('#syncUrl').fill(URL);
  await page.locator('#btnSyncSave').click();
  await expect(page.locator('#backfillConfirm')).toBeVisible(); // poprvé se ptá na starší kola
  await page.locator('#btnBackfillYes').click();
  await expect(page.locator('#syncInfo')).toContainText('Čeká na odeslání: 0');
  const rows = got.flatMap(b => b.rows);
  expect(rows.filter(r => r.Druh === 'úloha').length).toBe(8);
  expect(rows.filter(r => r.Druh === 'kolo').map(r => r.Patro)).toEqual(['Čísla', 'Písmena']);
  expect(rows.every(r => r.ID && r.Čas)).toBe(true);
  expect(got[0].stav.patra.find(p => p.Patro === 'Písmena').Celkem).toBeGreaterThan(0);
  const s = await saved(page);
  expect(s.sync.queue).toEqual([]);
  expect(s.sync.sent).toBe(rows.length);
});

test('bez internetu záznamy počkají a chyba se ukáže', async ({ page }) => {
  const URL = 'https://script.google.com/macros/s/TEST456/exec';
  await page.route(URL, route => route.abort());
  await openGame(page, { total: 5, sync: { url: URL, queue: [], last: 0, sent: 0, error: '', seq: 0, backfilled: true } });
  await playRound(page, 'Čísla');
  await page.locator('#btnEndHome').click();
  const s = await saved(page);
  expect(s.sync.queue.length).toBeGreaterThanOrEqual(9);
  expect(s.sync.error).not.toBe('');
});

test('vložený postup z jiného zařízení nepřebere název zařízení, adresu ani frontu tohoto zařízení', async ({ page }) => {
  const URL = 'https://script.google.com/macros/s/PC1/exec';
  await page.route(URL, route => route.abort());
  await openGame(page, { total: 5, sync: { url: URL, queue: [], last: 0, sent: 0, error: '', seq: 0, device: 'počítač děda Bob', uid: 'pc01', backfilled: true } });
  await openSettings(page);
  await expect(page.locator('#syncDevice')).toHaveValue('počítač děda Bob');
  const other = await page.evaluate(() => { const s = JSON.parse(JSON.stringify(window.__adam.save)); s.total = 41; s.sync = { url: 'https://script.google.com/macros/s/TABLET/exec', queue: [], last: 0, sent: 99, error: '', seq: 0, device: 'tablet', uid: 'tb01' }; return 'ADAMUV-DUL-POSTUP:' + JSON.stringify(s); });
  await page.locator('#btnImport').click();
  await page.locator('#transferText').fill(other);
  await page.locator('#btnImportYes').click();
  const s = await saved(page);
  expect(s.total).toBe(41);
  expect(s.sync).toMatchObject({ url: URL, device: 'počítač děda Bob', uid: 'pc01' });
});

test('hodnocení kola jde do tabulky jen jednou, s posledním číslem', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999 });
  await playRound(page, 'Písmena');
  for (const n of ['7 z 10', '1 z 10', '8 z 10']) await page.getByRole('button', { name: n, exact: true }).click();
  let q = (await saved(page)).sync.queue.filter(r => r.Druh === 'hodnocení');
  expect(q.length).toBe(0);
  await page.locator('#btnEndHome').click();
  q = (await saved(page)).sync.queue.filter(r => r.Druh === 'hodnocení');
  expect(q.map(r => r.Hodnocení)).toEqual([8]);
});

test('první zadání adresy: „Jen nová“ starší kola nepošle', async ({ page }) => {
  const URL = 'https://script.google.com/macros/s/TEST789/exec', got = [];
  await page.route(URL, async route => { got.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true }) }); });
  await openGame(page, { total: 5, log: [{ t: Date.now() - 86400000, d: '2026-10-19', level: 'numbers', clean: 8, done: 8, len: 8, ok: true, quit: false, secs: 44 }] });
  await playRound(page, 'Písmena');
  await page.locator('#btnEndHome').click();
  await openSettings(page);
  await page.locator('#syncUrl').fill(URL);
  await page.locator('#btnSyncSave').click();
  await page.locator('#btnBackfillNo').click();
  await expect(page.locator('#syncInfo')).toContainText('Čeká na odeslání: 0');
  const kola = got.flatMap(b => b.rows).filter(r => r.Druh === 'kolo');
  expect(kola.map(r => r.Patro)).toEqual(['Písmena']);
});

