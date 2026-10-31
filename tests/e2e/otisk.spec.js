// Otisk prstu místo příkladu (Ondřej 31. 10. 2026): na zařízení i telefonem rodiče přes QR kód; příklad zůstává záložní.
// WebAuthn v testovacím prohlížeči napodobí init skript (uv = jestli „otisk“ projde).
import { test, expect } from '@playwright/test';
import { openGame, openSettings } from './helpers.js';

const fakeWebAuthn = () => {
  window.__wa = { uv: true, creates: [], gets: [] };
  const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const resp = (type, challenge) => { const a = new Uint8Array(37); a[32] = window.__wa.uv ? 0x05 : 0x01; return { clientDataJSON: new TextEncoder().encode(JSON.stringify({ type, challenge: b64u(challenge) })).buffer, authenticatorData: a.buffer, getAuthenticatorData() { return a.buffer; } }; };
  window.PublicKeyCredential = { isUserVerifyingPlatformAuthenticatorAvailable: async () => true };
  const ids = { platform: new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1, 1]), 'cross-platform': new Uint8Array([2, 2, 2, 2, 2, 2, 2, 2, 2]) };
  Object.defineProperty(navigator, 'credentials', { value: {
    create: async ({ publicKey }) => { const k = publicKey.authenticatorSelection.authenticatorAttachment; window.__wa.creates.push({ k, hints: publicKey.hints }); return { rawId: ids[k].buffer, response: resp('webauthn.create', publicKey.challenge) }; },
    get: async ({ publicKey }) => { const t = publicKey.allowCredentials[0].transports[0]; window.__wa.gets.push(t); return { rawId: publicKey.allowCredentials[0].id.buffer, response: resp('webauthn.get', publicKey.challenge) }; },
  } });
};

test('otisk na zařízení: nastavit, pak se nastavení otevře bez příkladu; neověřený otisk nestačí', async ({ page }) => {
  await page.addInitScript(fakeWebAuthn);
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'game');
  await page.locator('#btnPassLocal').click();
  await expect(page.locator('#passInfo')).toContainText('Otisk je nastavený');
  expect((await page.evaluate(() => window.__wa.creates))[0]).toMatchObject({ k: 'platform' });
  await page.locator('#btnSetClose').click();
  await page.locator('#btnSettings').click();
  await expect(page.locator('#setOverlay')).toBeVisible(); // otisk se nabídl hned po klepnutí na kolo
  expect(await page.evaluate(() => window.__wa.gets)).toEqual(['internal']);
  await page.locator('#btnSetClose').click();
  await page.evaluate(() => { window.__wa.uv = false; });
  await page.locator('#btnSettings').click();
  await expect(page.locator('#gateMsg')).toContainText('nepovedlo');
  await expect(page.locator('#setOverlay')).toBeHidden();
  await expect(page.locator('#gateQ')).not.toBeEmpty(); // příklad zůstává
});

test('telefon rodiče přes QR kód: tlačítko u zámku, ověření jde přes telefon (hybrid)', async ({ page }) => {
  await page.addInitScript(fakeWebAuthn);
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'game');
  await page.locator('#btnPassPhone').click();
  await expect(page.locator('#passInfo')).toContainText('Telefon rodiče je nastavený');
  expect((await page.evaluate(() => window.__wa.creates))[0]).toMatchObject({ k: 'cross-platform', hints: ['hybrid'] });
  await page.locator('#btnSetClose').click();
  await page.locator('#btnSettings').click();
  await expect(page.locator('#btnGatePhone')).toBeVisible();
  await expect(page.locator('#btnGateLocal')).toBeHidden();
  await expect(page.locator('#setOverlay')).toBeHidden(); // telefon se nespouští sám, rodič klepne
  await page.locator('#btnGatePhone').click();
  await expect(page.locator('#setOverlay')).toBeVisible();
  expect(await page.evaluate(() => window.__wa.gets)).toEqual(['hybrid']);
  // zrušit otisky: zámek je zase jen příklad
  await page.locator('#btnPassOff').click();
  await page.locator('#btnSetClose').click();
  await page.locator('#btnSettings').click();
  await expect(page.locator('#gatePass')).toBeHidden();
});

test('bez WebAuthn: nastavení to vysvětlí, zámek je příklad jako dřív', async ({ page }) => {
  await page.addInitScript(() => { delete window.PublicKeyCredential; });
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'game');
  await expect(page.locator('#passInfo')).toContainText('neumí');
  await expect(page.locator('#btnPassLocal')).toBeHidden();
});
