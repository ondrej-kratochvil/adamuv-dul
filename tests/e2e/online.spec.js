// Schoolcraft online: žebříček, nastavení a přestěhování z GitHub Pages (server napodobený přes page.route).
import { test, expect } from '@playwright/test';
import { openGame, openSettings, saved } from './helpers.js';

const ID = '12345678-1234-1234-1234-123456789abc', SECRET = 'b'.repeat(64);
async function mockServer(page, players, saves = {}) {
  const calls = [];
  await page.route(/schoolcraft\.games\/api\//, async route => {
    const req = route.request(), url = new URL(req.url()), m = req.method();
    calls.push(`${m} ${url.pathname}`);
    const json = body => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (m === 'POST' && url.pathname === '/api/players') return json({ id: ID, secret: SECRET });
    if (m === 'PUT' && url.pathname === '/api/me') return json({ ok: true });
    if (m === 'POST' && url.pathname === '/api/events') return json({ ok: true });
    if (m === 'GET' && url.pathname === '/api/leaderboard') return json({ week: '2026-10-19', players });
    if (m === 'GET' && url.pathname === '/api/me/save') { const code = (req.headers().authorization || '').slice(7); return json({ save: saves[code] || null }); }
    return route.fulfill({ status: 404, body: '{}' });
  });
  return calls;
}
const S = (o = {}) => ({ outfit: { shirt: 'oranzove' }, total: 10, house: 10, farm: 0, village: 0, pets: 0, babies: 0, streak: 1, cards: 0, dragon: 0, portal: false, ...o });

test('žebříček: Víťa vede, u Adama „(ty)“, co má Víťa navíc je zvýrazněné', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999 });
  const calls = await mockServer(page, [
    { nick: 'Víťa', points: 15, summary: S({ total: 20, house: 12, farm: 3 }), me: false },
    { nick: 'Adam', points: 12, summary: S({ total: 5, house: 5 }), me: true },
  ]);
  await page.getByRole('button', { name: 'Žebříček', exact: true }).click();
  await expect(page.locator('#leadList .lead-row')).toHaveCount(2);
  await expect(page.locator('#leadList .lead-row').first()).toContainText('Víťa');
  await expect(page.locator('#leadList .lead-row').first()).toContainText('15 bodů');
  await expect(page.locator('#leadList .lead-row.me')).toContainText('Adam (ty)');
  await expect(page.locator('#leadList .lead-row').first().locator('.lead-badge.more')).toContainText(['dům hotový', 'farma 3/']);
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('Vede Víťa s 15 body. Ty máš 12 bodů.');
  expect(calls).toEqual(expect.arrayContaining(['POST /api/players', 'PUT /api/me', 'GET /api/leaderboard']));
  expect((await saved(page)).cloud).toMatchObject({ id: ID, secret: SECRET });
  await page.locator('#leadList .lead-row').first().click();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('To ty ještě nemáš: hotový dům');
});

test('karta Online: vypnutí, přezdívka, kód pro přenos; vypnuté online žebříček nenačte', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openGame(page, { total: 5, seenVersion: 999 });
  await mockServer(page, []);
  await openSettings(page, 'online');
  await expect(page.locator('#cloudNick')).toHaveValue('Adam');
  await page.locator('#cloudNick').fill('Adam K.');
  await page.locator('#cloudNick').dispatchEvent('change');
  await expect.poll(async () => (await saved(page)).cloud.nick).toBe('Adam K.');
  await page.locator('#btnCloudCode').click();
  await expect(page.locator('#cloudCode')).toHaveValue(`${ID}.${SECRET}`);
  await page.locator('#btnCloudOn').click();
  expect((await saved(page)).cloud.on).toBe(false);
  await page.locator('#btnSetClose').click();
  await page.getByRole('button', { name: 'Žebříček', exact: true }).click();
  await expect(page.locator('#leadInfo')).toContainText('Online hraní je vypnuté');
});

test('přestěhování: nová adresa stáhne postup všech profilů podle kódů a nastaví je', async ({ page }) => {
  const adamCode = `${ID}.${SECRET}`, vitaCode = `${ID.replace('1234', '9999')}.${'c'.repeat(64)}`;
  await openGame(page, null, { fresh: true });
  await mockServer(page, [], {
    [adamCode]: { schema: 11, total: 7, emeralds: 42, player: 'adam', rounds: {} },
    [vitaCode]: { schema: 11, total: 2, player: { v: 1, name: 'Víťa', voc: 'Víťo', poss: 'Víťův', gender: 'm', family: [], friends: [] }, rounds: {} },
  });
  const data = { active: 'adam', profiles: [{ id: 'adam', name: 'Adam', code: adamCode, pub: true }, { id: 'pvita', name: 'Víťa', code: vitaCode, pub: false }] };
  const enc = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
  await page.goto('./?presun=1#presun=' + enc); // jiná adresa, ať se stránka opravdu načte (samotné # by byl skok na stránce)
  await page.waitForURL(u => !u.hash.includes('presun'));
  await expect(page.locator('#home')).toBeVisible();
  await page.waitForFunction(() => window.__adam && window.__adam.save.total === 7); // po znovunačtení hra ještě chvíli startuje (na GitHubu rychleji než doma)
  const s = await saved(page);
  expect(s).toMatchObject({ emeralds: 42, player: 'adam', cloud: { id: ID, on: true, pub: true } });
  const reg = await page.evaluate(() => JSON.parse(localStorage.getItem('adamuv-dul-profily')));
  expect(reg.list.map(p => p.name)).toEqual(['Adam', 'Víťa']);
  const vita = await page.evaluate(() => JSON.parse(localStorage.getItem('adamuv-dul-v1:pvita')));
  expect(vita).toMatchObject({ total: 2, cloud: { pub: false } });
});

test('karta Postup doporučí přenos přes kód hráče a tlačítko otevře kartu Online', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999 });
  await openSettings(page, 'progress');
  await expect(page.locator('[data-tab="progress"].set-tab')).toContainText('Doporučeno');
  await page.locator('#btnGoOnline').click();
  await expect(page.locator('#cloudNick')).toBeVisible();
});
