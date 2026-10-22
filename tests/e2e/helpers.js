// Společné pomůcky pro testy v prohlížeči.
// Hra vystavuje window.__adam = { R (běžící kolo), TR (obtahování), save (uložený stav) }.
import { expect } from '@playwright/test';

export const KEY = 'adamuv-dul-v1';

// Hlas prohlížeče nahradíme rychlou náhražkou: promluva hned „doběhne“ a text se zapíše do window.__said.
export async function mockSpeech(page) {
  await page.addInitScript(() => {
    window.__said = [];
    if (!window.SpeechSynthesis) return;
    SpeechSynthesis.prototype.speak = function (u) { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); };
    SpeechSynthesis.prototype.cancel = function () {};
  });
}

// Otevře hru s daným uloženým stavem (null = čistá hra). Ranní kartu (world/daily.js) zavře, když day není true.
export async function openGame(page, state = null, { day = false } = {}) {
  await mockSpeech(page);
  // testy nezávislé na internetu: písma z Google se nestahují (hra má náhradní písma)
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(([key, st]) => {
    if (sessionStorage.getItem('__seeded')) return; // jen při prvním načtení, reload pak vidí, co hra uložila
    sessionStorage.setItem('__seeded', '1');
    localStorage.clear();
    if (st) localStorage.setItem(key, JSON.stringify(st));
  }, [KEY, state]);
  await page.goto('./');
  await expect(page.locator('#home')).toBeVisible();
  await page.locator('body[data-day-checked]').waitFor({ state: 'attached' }); // karta přijde až po zjištění verze
  if (!day && await page.locator('#dayOverlay').isVisible()) await page.locator('#btnDayLater').click();
  return errors;
}

// nastavení pro rodiče: ozubené kolo a pak příklad pro dospělého (násobení)
// tab = karta nastavení (game, voice, family, progress, profiles, sync)
export async function openSettings(page, tab) {
  // po přepnutí profilu (nové načtení) přijde ranní karta i pro nového hráče
  if (await page.locator('#dayOverlay').isVisible()) await page.locator('#btnDayLater').click();
  await page.locator('#btnSettings').click();
  const [a, b] = (await page.locator('#gateQ').textContent()).split(' × ').map(Number);
  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('#btnGateOk').click();
  await expect(page.locator('#setOverlay')).toBeVisible();
  if (tab) await page.locator(`.set-tabs [data-tab="${tab}"]`).click();
}

export const saved = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);

// Projde obtahování aktuálního znaku myší po bodech tahů.
async function traceCurrent(page) {
  const st = await page.evaluate(() => {
    const t = window.__adam.TR, r = window.__adam.R;
    if (!t || !r || r.busy || !t.strokes[t.si]) return null;
    const c = document.querySelector('#traceCanvas').getBoundingClientRect();
    return { pts: t.strokes[t.si].pts, k: t.k, x: c.left, y: c.top };
  });
  if (!st) return;
  const P = st.pts.map(([x, y]) => [st.x + x * st.k, st.y + y * st.k]);
  await page.mouse.move(...P[0]); await page.mouse.down();
  for (let i = 1; i < P.length; i += 2) await page.mouse.move(...P[i]);
  await page.mouse.move(...P[P.length - 1]); await page.mouse.up();
}

// Dohraje kolo: wrong = kolik úkolů nejdřív odpovědět špatně (kostky) nebo kolikrát vyjet z dráhy (psaní).
export async function playRound(page, label, { wrong = 0 } = {}) {
  if (label) await page.getByRole('button', { name: label, exact: true }).first().click(); // bez názvu: kolo už běží

  let mistakes = wrong;
  const end = page.locator('#endOverlay');
  for (let k = 0; k < 600; k++) {
    if (await end.isVisible()) return;
    // Mluvení: úkoly v panelu (vyslovit s rodičem, foukání bez mikrofonu potvrdí tlačítko; cvik doběhne sám)
    const panel = page.locator('#speechPanel');
    if (await panel.isVisible()) {
      const btns = panel.locator('.gbtn'), n = await btns.count();
      if (n) {
        const bad = mistakes > 0 && n === 3;
        await btns.nth(bad ? 1 : 0).click().catch(() => {});
        if (bad) mistakes--;
      }
      await page.waitForTimeout(150);
      continue;
    }
    const s = await page.evaluate(() => { const r = window.__adam.R; return r ? { level: r.level, busy: r.busy, stuck: r.stuck, ready: !!(r.els || window.__adam.TR), first: r.firstTry } : null; });
    if (s && !s.busy && !s.stuck && s.ready) {
      if (s.level === 'writing') {
        if (mistakes > 0 && s.first) {
          // vyjet z dráhy: začít u tečky a ujet stranou
          const p0 = await page.evaluate(() => { const t = window.__adam.TR, c = document.querySelector('#traceCanvas').getBoundingClientRect(); const q = t.strokes[t.si].pts[t.pi]; return [c.left + q[0] * t.k, c.top + q[1] * t.k]; });
          await page.mouse.move(...p0); await page.mouse.down(); await page.mouse.move(p0[0] + 150, p0[1] + 150, { steps: 4 }); await page.mouse.up();
          mistakes--;
        } else await traceCurrent(page);
      } else {
        const bad = mistakes > 0 && s.first;
        await page.evaluate(bad => { const r = window.__adam.R; const i = r.choices.indexOf(r.target); r.els[bad ? (i + 1) % r.choices.length : i].click(); }, bad);
        if (bad) mistakes--;
      }
    }
    await page.waitForTimeout(80);
  }
  throw new Error('kolo neskončilo');
}

export const LEVELS = ['Písmena', 'Slabiky', 'Slova', 'Čtení', 'Čísla', 'Počty', 'Mluvení', 'Psaní'];
