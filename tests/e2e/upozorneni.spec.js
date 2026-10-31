// Ranní upozornění (Ondřej 31. 10. 2026): rodič zapne v nastavení, hra se přihlásí u služby upozornění a na serveru.
// Služba upozornění v testovacím prohlížeči není, napodobí ji init skript (service worker a souhlas).
import { test, expect } from '@playwright/test';
import { openGame, openSettings } from './helpers.js';

const fakePush = () => {
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-tablet', toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'BB', auth: 'AA' } }; }, unsubscribe: async () => { window.__unsub = true; return true; } };
  let current = null;
  const reg = {
    pushManager: { getSubscription: async () => current, subscribe: async o => { window.__subOpts = o; current = sub; return sub; } },
    showNotification: async (title, o) => { window.__shown = { title, body: o.body }; },
  };
  Object.defineProperty(navigator, 'serviceWorker', { value: { ready: Promise.resolve(reg), register: async () => reg } });
  window.PushManager = function () {};
  window.Notification = { permission: 'default', requestPermission: async () => 'granted' };
};

test('zapnutí ranního upozornění v 7:00, změna času, vypnutí a zkušební upozornění', async ({ page }) => {
  await page.addInitScript(fakePush);
  await openGame(page, { total: 3, seenVersion: 999 });
  const calls = [];
  await page.route(/schoolcraft\.games\/api\/push/, async route => {
    const r = route.request(); calls.push({ method: r.method(), url: r.url(), body: r.postDataJSON ? (() => { try { return r.postDataJSON(); } catch (e) { return null; } })() : null });
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(r.url().endsWith('/key') ? { key: 'AQID' } : { ok: true }) });
  });
  await openSettings(page, 'game');
  await expect(page.locator('#pushHour')).toHaveValue('7');
  await page.locator('#btnPushOn').click();
  await expect(page.locator('#pushInfo')).toContainText('každý den v 7:00');
  await expect(page.locator('#btnPushOn')).toHaveText('Upozornění: zapnuto');
  const post = calls.find(c => c.method === 'POST');
  expect(post.body).toMatchObject({ endpoint: 'https://fcm.googleapis.com/fcm/send/test-tablet', hour: 7 });
  expect(await page.evaluate(() => window.__subOpts.userVisibleOnly)).toBe(true);
  // text pro service worker osloví hráče
  const text = await page.evaluate(async () => (await (await caches.open('schoolcraft-upozorneni')).match('/__upozorneni')).json());
  expect(text.body).toMatch(/^Dobré ráno, .+! Čeká tě dnešní úkol za 5 smaragdů\.$/);
  await page.locator('#pushHour').selectOption('6');
  await expect(page.locator('#pushInfo')).toContainText('v 6:00');
  expect(calls.filter(c => c.method === 'POST').at(-1).body.hour).toBe(6);
  await page.locator('#btnPushTest').click();
  await expect.poll(() => page.evaluate(() => window.__shown && window.__shown.title)).toBe('Schoolcraft');
  await page.locator('#btnPushOn').click();
  await expect(page.locator('#btnPushOn')).toHaveText('Upozornění: vypnuto');
  expect(calls.some(c => c.method === 'DELETE')).toBe(true);
  expect(await page.evaluate(() => window.__unsub)).toBe(true);
});

test('bez podpory upozornění to nastavení vysvětlí a nic nespadne', async ({ page }) => {
  await page.addInitScript(() => { delete window.PushManager; });
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'game');
  await expect(page.locator('#pushInfo')).toContainText(/neumí|na plochu/);
});
