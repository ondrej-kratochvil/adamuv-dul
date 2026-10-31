// Bezpečnost (31. 10. 2026): Content Security Policy v sestavené hře a nic ji neporušuje; API se neukládá do mezipaměti
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound } from './helpers.js';

test('sestavená hra má CSP a běžné hraní ji neporuší (kolo, nastavení, poklad, o hře)', async ({ page }) => {
  await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
  const msgs = []; page.on('console', m => { if (/Content Security Policy/i.test(m.text())) msgs.push(m.text()); });
  await openGame(page, { total: 14, seenVersion: 999, emeralds: 30 });
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain('fonts.googleapis');
  await playRound(page, 'Písmena');
  await page.locator('#btnEndHome').click();
  await openSettings(page, 'online');
  await page.locator('#btnSetClose').click();
  await page.locator('#btnAbout').click(); await page.locator('#btnAboutClose').click();
  await page.getByRole('button', { name: 'Poklad', exact: true }).click();
  await page.locator('#btnHuntBack').click();
  await page.getByRole('button', { name: 'Farma', exact: true }).click();
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  expect(msgs).toEqual([]);
  // písma z vlastní adresy (ne z Google Fonts)
  expect(await page.evaluate(() => [...document.styleSheets].some(s => (s.href || '').includes('googleapis')))).toBe(false);
  await expect.poll(() => page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('700 20px Andika', 'Žluťoučký'); })).toBe(true);
});
