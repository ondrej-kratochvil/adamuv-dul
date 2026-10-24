// Věty v Čtení a psací písmo v Psaní (Ondřej 24. 10. 2026: „Přidej psací písmo a věty“).
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

test('Adam má psací písmo zapnuté; rodič ho vypne a zapne; kolo Psaní s psacími písmeny doběhne', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999, rounds: { writing: 9 }, stages: { writing: 2 } });
  expect((await saved(page)).cursive).toBe(true);
  await openSettings(page, 'game');
  await expect(page.locator('#btnCursive')).toHaveText('Psací písmo: zapnuto');
  await page.locator('#btnCursive').click();
  await expect(page.locator('#btnCursive')).toHaveText('Psací písmo: vypnuto');
  expect((await saved(page)).cursive).toBe(false);
  await page.locator('#btnCursive').click();
  await page.locator('#btnSetClose').click();
  // kolo: psací písmeno se objeví (pool je velký, proto více kol podle potřeby)
  let seen = false;
  for (let k = 0; k < 4 && !seen; k++) {
    await page.getByRole('button', { name: 'Psaní', exact: true }).first().click();
    for (let i = 0; i < 400; i++) {
      if (await page.locator('#endOverlay').isVisible()) break;
      const ch = await page.evaluate(() => window.__adam.TR && window.__adam.TR.ch);
      if (ch && ch.startsWith('c-')) seen = true;
      await playRoundStep(page);
    }
    await page.locator('#btnEndHome').click();
  }
  expect(seen).toBe(true);
});

// jeden krok obtahování (jako helpers.playRound, ale bez kliknutí na patro)
async function playRoundStep(page) {
  const st = await page.evaluate(() => {
    const t = window.__adam.TR, r = window.__adam.R;
    if (!t || !r || r.busy || !t.strokes[t.si]) return null;
    const c = document.querySelector('#traceCanvas').getBoundingClientRect();
    return { pts: t.strokes[t.si].pts, k: t.k, x: c.left, y: c.top };
  });
  if (!st) { await page.waitForTimeout(80); return; }
  const P = st.pts.map(([x, y]) => [st.x + x * st.k, st.y + y * st.k]);
  await page.mouse.move(...P[0]); await page.mouse.down();
  for (let i = 1; i < P.length; i += 2) await page.mouse.move(...P[i]);
  await page.mouse.move(...P[P.length - 1]); await page.mouse.up();
  await page.waitForTimeout(80);
}

test('Čtení: po pár kolech přijdou věty; správný obrázek kolo posune', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999, rounds: { reading: 6 }, stages: { reading: 1 } });
  await page.getByRole('button', { name: 'Čtení', exact: true }).click();
  let sentence = '';
  for (let i = 0; i < 300 && !sentence; i++) {
    const s = await page.evaluate(() => { const r = window.__adam.R; return r && r.els && !r.busy ? { t: document.querySelector('#task').textContent } : null; });
    if (s && / /.test(s.t) && /\.$/.test(s.t)) { sentence = s.t; break; }
    if (s) await page.evaluate(() => { const r = window.__adam.R; r.els[r.choices.indexOf(r.target)].click(); });
    await page.waitForTimeout(150);
    if (await page.locator('#endOverlay').isVisible()) { await page.locator('#btnAgain').click(); }
  }
  expect(sentence).toMatch(/^\S+ .+\.$/);
  // kostka se rozbije až po několika ranách krumpáčem
  for (let i = 0; i < 20; i++) {
    const busy = await page.evaluate(() => { const r = window.__adam.R; if (!r || r.busy) return true; r.els[r.choices.indexOf(r.target)].click(); return false; });
    if (busy) break;
    await page.waitForTimeout(100);
  }
  await expect.poll(() => page.evaluate(() => window.__said.join(' '))).toMatch(/[A-ZÁ-Ž][a-zá-ž]+ (má|solí|lepí|mele) [a-zá-ž]+\.|Máme [a-zá-ž]+\./);
});
