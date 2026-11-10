// Společné pomůcky pro testy v prohlížeči.
// Hra vystavuje window.__adam = { R (běžící kolo), TR (obtahování), save (uložený stav) }.
import { expect } from '@playwright/test';

export const KEY = 'adamuv-dul-v1';

// Hlas prohlížeče nahradíme rychlou náhražkou: promluva hned „doběhne“ a text se zapíše do window.__said.
export async function mockSpeech(page) {
  await page.addInitScript(() => {
    window.__said = [];
    if (!window.SpeechSynthesis) return;
    SpeechSynthesis.prototype.speak = function (u) { if (u.text.trim()) window.__said.push(u.text); // prázdná promluva = odemčení hlasu po klepnutí (audio/speech.js)
    setTimeout(() => u.onend && u.onend(), 5); };
    SpeechSynthesis.prototype.cancel = function () {};
  });
}

// Otevře hru s daným uloženým stavem (null = čistá hra s Adamem; fresh = úplně nová hra bez hráče).
// Ranní kartu (world/daily.js) zavře, když day není true.
// Přirozený hlas bez serveru a bez zvuku: /api/tts vrátí místo MP3 rovnou text věty, přehrávač ho „přehraje“
// (zapíše do window.__played) a za chvíli ohlásí konec. Vrací pole textů, o které hra server požádala.
// ios: jako Safari na iPhonu, přehrávač smí hrát bez klepnutí, až když se jednou rozjel při klepnutí (jinak NotAllowedError)
export async function mockCloudVoice(page, { ios = false } = {}) {
  const asked = [];
  await page.route(/schoolcraft\.games\/api\/tts/, async route => {
    const q = route.request().postDataJSON() || {};
    asked.push(q.text);
    await route.fulfill({ status: 200, contentType: 'audio/mpeg', headers: { 'Access-Control-Allow-Origin': '*' }, body: q.text });
  });
  await page.addInitScript(ios => {
    window.__played = []; window.__blocked = 0;
    // obsah blobu podle adresy (fetch na blob: by zakázala CSP hry)
    const texts = new Map(), make = URL.createObjectURL.bind(URL);
    URL.createObjectURL = b => { const u = make(b); if (b instanceof Blob) texts.set(u, b.text()); return u; };
    const P = HTMLMediaElement.prototype;
    // adresa bez skutečného načítání (text místo MP3 by prohlížeč odmítl jako chybu zvuku)
    Object.defineProperty(P, 'src', { configurable: true, get() { return this.__src || ''; }, set(v) { this.__src = String(v); } });
    P.play = function () {
      const el = this, src = el.src;
      if (ios) {
        if (navigator.userActivation && navigator.userActivation.isActive) el.__unlocked = true;
        if (!el.__unlocked) { window.__blocked++; return Promise.reject(new DOMException('not allowed', 'NotAllowedError')); }
      }
      if (texts.has(src)) texts.get(src).then(t => { if (!t.startsWith('RIFF')) window.__played.push(t); });
      setTimeout(() => { if (el.src === src) el.dispatchEvent(new Event('ended')); }, 150);
      return Promise.resolve();
    };
    P.pause = function () {};
    // Web Audio: „rozbalení“ vrátí text, zdroj ho „přehraje“; na iPhonu běží AudioContext až po klepnutí (resume)
    const B = window.BaseAudioContext && BaseAudioContext.prototype;
    if (B) {
      Object.defineProperty(B, 'state', { configurable: true, get() { return this.__running || !ios ? 'running' : 'suspended'; } });
      const resume = B.resume || AudioContext.prototype.resume;
      AudioContext.prototype.resume = function () { if (!ios || (navigator.userActivation && navigator.userActivation.isActive)) this.__running = true; return Promise.resolve(); };
      B.decodeAudioData = function (ab) { return Promise.resolve({ __text: new TextDecoder().decode(ab), duration: 0.1 }); };
      const make = B.createBufferSource;
      B.createBufferSource = function () {
        const real = make.call(this), fake = {
          buffer: null, onended: null, connect(n) { return fake.buffer && fake.buffer.__text ? n : real.connect(n); },
          start(...x) { if (fake.buffer && fake.buffer.__text) { window.__played.push(fake.buffer.__text); setTimeout(() => fake.onended && fake.onended(), 150); } else { real.buffer = fake.buffer; real.start(...x); } },
          stop() { fake.onended = null; }, disconnect() {},
        };
        return fake;
      };
      void resume;
    }
  }, ios);
  return asked;
}

export async function openGame(page, state = null, { day = false, fresh = false, cloudVoice = false, ios = false } = {}) {
  if (!state && !fresh) state = { player: 'adam', gameName: 'Adamův důl' };
  await mockSpeech(page);
  // testy nezávislé na internetu: písma z Google se nestahují (hra má náhradní písma)
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  // server Schoolcraft v testech není (testy, které ho potřebují, si ho napodobí vlastním page.route)
  await page.route(/schoolcraft\.games\/api\//, r => r.abort());
  const errors = [];
  if (cloudVoice) errors.asked = await mockCloudVoice(page, { ios }); // registrováno později = má přednost před abort
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
  if (tab) await settingsTab(page, tab);
}
// část nastavení ze stromu (na mobilu případně nejdřív Zpět na seznam)
export async function settingsTab(page, tab) {
  if (await page.locator('#btnSetBack').isVisible()) await page.locator('#btnSetBack').click();
  await page.locator(`.set-tree [data-tab="${tab}"]`).click();
}

export const saved = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);

// Projde obtahování aktuálního znaku myší po bodech tahů.
async function traceCurrent(page) {
  const st = await page.evaluate(() => {
    const t = window.__adam.TR, r = window.__adam.R;
    if (!t || !r || r.busy || !t.strokes[t.si]) return null;
    const c = document.querySelector('#traceCanvas').getBoundingClientRect();
    return { pts: t.strokes[t.si].pts.slice(t.pi), k: t.k, x: c.left, y: c.top }; // od zelené tečky (po vyjetí z dráhy se pokračuje)
  });
  if (!st) return;
  const P = st.pts.map(([x, y]) => [st.x + x * st.k, st.y + y * st.k]);
  await page.mouse.move(...P[0]); await page.mouse.down();
  for (let i = 1; i < P.length; i += 2) await page.mouse.move(...P[i]);
  await page.mouse.move(...P[P.length - 1]); await page.mouse.up();
}

// Dohraje kolo: wrong = kolik úkolů nejdřív odpovědět špatně (kostky) nebo kolikrát vyjet z dráhy (psaní).
// repeat: chybovat i opakovaně v jednom úkolu (kolo má jen 6 úkolů, víc chyb jinak nejde)
// listen: klepnout až po zadání (jako dítě), ne hned, jak jsou kostky; jinak hra zadání přeskočí
export async function playRound(page, label, { wrong = 0, repeat = false, listen = false } = {}) {
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
    const s = await page.evaluate(() => { const r = window.__adam.R; return r ? { level: r.level, busy: r.busy, stuck: r.stuck, ready: !!(r.els || window.__adam.TR), first: r.firstTry, left: r.len - r.i, heard: !!r.heardAt } : null; });
    if (s && !s.busy && !s.stuck && s.ready && (!listen || s.heard || s.level === 'writing')) {
      if (s.level === 'writing') {
        if (mistakes > 0 && s.first) {
          // vyjet z dráhy: začít u tečky a ujet stranou
          const p0 = await page.evaluate(() => { const t = window.__adam.TR, c = document.querySelector('#traceCanvas').getBoundingClientRect(); const q = t.strokes[t.si].pts[t.pi]; return [c.left + q[0] * t.k, c.top + q[1] * t.k]; });
          await page.mouse.move(...p0); await page.mouse.down(); await page.mouse.move(p0[0] + 150, p0[1] + 150, { steps: 4 }); await page.mouse.up();
          mistakes--;
        } else await traceCurrent(page);
      } else {
        // repeat: chyba v každém úkolu napoprvé, navíc opakovaně, když chyb zbývá víc než úkolů
        const bad = mistakes > 0 && (s.first || (repeat && mistakes >= s.left));
        await page.evaluate(bad => { const r = window.__adam.R; const i = r.choices.indexOf(r.target); r.els[bad ? (i + 1) % r.choices.length : i].click(); }, bad);
        if (bad) mistakes--;
      }
    }
    await page.waitForTimeout(80);
  }
  throw new Error('kolo neskončilo');
}

export const LEVELS = ['Písmena', 'Slabiky', 'Slova', 'Čtení', 'Čísla', 'Počty', 'Mluvení', 'Psaní'];
