// Deník kol, hodnocení a statistiky
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { speak } from '../audio/speech.js';
import { audio, tone } from '../audio/sfx.js';
import { LETTERS, SYLL } from '../content/letters.ts';
import { range } from '../levels/math.js';
import { GLYPHS, SHAPE_NAMES } from '../levels/writing.js';
import { WORDS } from '../content/words.ts';
import { LEVELS, PIC_WORDS } from '../levels/reading.js';
import { show } from '../ui/screens.js';
import { streakNow } from '../rewards/streak.js';
import { dayStr, pad2 } from '../logic/calendar.ts';
import { mastery } from '../logic/mastery.ts';
import { gameName } from './name.js';
import { levelName, queueRows } from './sync.js';
import { avgSecs } from '../logic/mastery.ts';
import { confusions, quickWrongShare, slowItems, weakItems } from '../logic/practice.ts';

const LOG_MAX = 1500;
function logRound(ok, quit = false) {
  const e = { t: Date.now(), d: dayStr(), level: G.R.level, clean: G.R.clean, done: G.R.i, len: G.R.len, ok, quit, secs: Math.round((Date.now() - G.R.start) / 1000), ...(G.R.pauses ? { pauses: G.R.pauses, pauseSecs: Math.round(G.R.pauseMs / 1000) } : {}) };
  save.log.push(e);
  queueRows([{ Druh: 'kolo', Patro: levelName(e.level), 'Bez chyby': e.clean, Úloh: e.len, Hotovo: e.done, Povedené: ok ? 'ano' : 'ne', Odešel: quit ? 'ano' : 'ne', Sekundy: e.secs, Pauzy: e.pauses || 0, 'Pauza (s)': e.pauseSecs || 0 }]);
  if (save.log.length > LOG_MAX) save.log.splice(0, save.log.length - LOG_MAX);
  persist();
  if (!quit) renderRate();
}
const RATE_COLORS = ['#e05a45', '#e8704a', '#ee8a4e', '#f2a650', '#f4c153', '#e6cf55', '#c8d258', '#a6d25c', '#86cc5f', '#5fc062'];
function renderRate() {
  const row = $('#rateRow'); row.innerHTML = '';
  const entry = save.log[save.log.length - 1];
  for (let n = 1; n <= 10; n++) {
    const b = document.createElement('button'); b.textContent = n; b.style.background = RATE_COLORS[n - 1];
    b.setAttribute('aria-label', `${n} z 10`); b.setAttribute('aria-pressed', String(entry.rate === n));
    b.addEventListener('click', () => { audio(); entry.rate = n; persist(); queueRows([{ Druh: 'hodnocení', Patro: levelName(entry.level), Hodnocení: n }]); renderRate(); tone(400 + n * 60, 0, .1, 'square', .05); speak(`${n} z 10. ${n >= 8 ? 'Super, to mě těší!' : n >= 5 ? 'Díky!' : 'Díky, zkusím to vylepšit.'}`); });
    row.appendChild(b);
  }
}
const fmtRate = x => x.toFixed(1).replace('.', ',') + ' z 10';
const kol = n => `${n} ${n === 1 ? 'kolo' : n >= 2 && n <= 4 ? 'kola' : 'kol'}`;
const fmtMin = secs => secs < 60 ? `${secs} s` : `${Math.round(secs / 60)} min`;
const fmtDate = t => { const d = new Date(t); return `${d.getDate()}. ${d.getMonth() + 1}. ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
function levelItems(key) {
  if (key === 'letters') return LETTERS;
  if (key === 'syllables') return SYLL;
  if (key === 'words') return WORDS;
  if (key === 'reading') return PIC_WORDS;
  if (key === 'writing') return Object.keys(GLYPHS);
  if (key === 'numbers') return range(0, 20).map(String);
  return Object.keys(save.stats).filter(k => k.startsWith(key + ':')).map(k => k.slice(key.length + 1));
}
const itemLabel = (key, it) => key === 'writing' && SHAPE_NAMES[it] ? SHAPE_NAMES[it].replace(/u$/, 'a') : key === 'math' ? it.replace('-', '−') : it;
function levelSummary(key) {
  const rows = save.log.filter(e => e.level === key);
  const played = rows.filter(e => !e.quit), rated = rows.filter(e => e.rate);
  const tasks = played.reduce((a, e) => a + e.len, 0), clean = played.reduce((a, e) => a + e.clean, 0);
  return {
    rounds: played.length, ok: played.filter(e => e.ok).length, quit: rows.filter(e => e.quit).length,
    acc: tasks ? Math.round(clean / tasks * 100) : null,
    rate: rated.length ? (rated.reduce((a, e) => a + e.rate, 0) / rated.length) : null,
    secs: rows.reduce((a, e) => a + e.secs, 0), last: rows.length ? rows[rows.length - 1].t : null,
  };
}
const fmtSecs = x => x.toFixed(1).replace('.', ',') + ' s';
// nejslabší úlohy: z kostek (logic/practice.ts) a k tomu psaní s potížemi
function practiceList() {
  const w = weakItems(save.stats).slice(0, 12);
  Object.entries(save.stats).filter(([k, s]) => k.startsWith('writing:') && mastery(s) === 'bad').forEach(([k]) => w.push({ level: 'writing', item: k.slice(8), score: 0, why: ['vyjíždí z dráhy'] }));
  return w;
}
// u patra: nad čím přemýšlí nejdéle, co si s čím plete, kolik chyb je rychlý tip
function levelDetails(key) {
  const out = [], slow = slowItems(save.stats, key, 5), conf = confusions(save.stats, key, 5), q = quickWrongShare(save.stats, key);
  if (slow.length) out.push(`Nejdéle přemýšlí: ${slow.map(x => `<b>${itemLabel(key, x.item)}</b> ${fmtSecs(x.secs)}`).join(', ')}`);
  if (conf.length) out.push(`Plete si: ${conf.map(c => `<b>${itemLabel(key, c.item)}</b> → ${itemLabel(key, c.with)} ${c.count}×`).join(', ')}`);
  if (q !== null && (conf.length || q > 0)) out.push(`Rychlé tipy (chyba do 1,2 s od zadání): ${Math.round(q * 100)} % chyb`);
  return out;
}
function openStats() {
  $('#setOverlay').hidden = true; show('stats'); renderStats();
}
function renderStats() {
  const body = $('#statsBody'); body.innerHTML = '';
  const all = save.log.filter(e => !e.quit), rated = save.log.filter(e => e.rate);
  const secs = save.log.reduce((a, e) => a + e.secs, 0);
  const days = new Set(save.log.map(e => e.d)).size;
  const kp = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
  body.insertAdjacentHTML('beforeend', `<h2>Přehled</h2><div class="kpis">${kp(all.length, 'odehraná kola')}${kp(all.length ? Math.round(all.filter(e => e.ok).length / all.length * 100) + ' %' : '–', 'povedených kol')}${kp(fmtMin(secs), 'celkem hraní')}${kp(days, days === 1 ? 'den hraní' : 'dní hraní')}${kp(rated.length ? fmtRate(rated.reduce((a, e) => a + e.rate, 0) / rated.length) : '–', 'průměrné hodnocení')}${kp(save.streak.best, 'nejdelší řada dní')}</div>`);
  // co procvičit: slabé úlohy (chyby, záměny, dlouhé přemýšlení), z nich skládá kolo tlačítko Procvičit
  const weak = practiceList();
  body.insertAdjacentHTML('beforeend', `<h3>Co procvičit</h3><p>${weak.length ? weak.map(w => `<b>${itemLabel(w.level, w.item)}</b> (${levelName(w.level).toLowerCase()}: ${w.why.join(', ')})`).join('; ') : 'Zatím nic, nebo ještě málo dat.'}</p><p>Z úloh v kostkách skládá kolo dlaždice <b>Procvičit</b> na úvodní obrazovce${save.practice ? ` (odehráno ${kol(save.practice)})` : ''}.</p>`);
  body.insertAdjacentHTML('beforeend', '<div class="legend"><span class="chip-i good">zvládnuté</span><span class="chip-i mid">učí se</span><span class="chip-i bad">potíže</span><span class="chip-i">zatím nezkoušené</span></div>');
  Object.entries(LEVELS).forEach(([key, L]) => {
    const sm = levelSummary(key);
    const head = `<h3>${L.name} <small>${kol(sm.rounds)} (povedená ${sm.ok})${sm.acc !== null ? `, bez chyby ${sm.acc} %` : ''}${sm.rate !== null ? `, baví ho ${fmtRate(sm.rate)}` : ''}${sm.quit ? `, ${sm.quit}× odešel z rozehraného kola` : ''}${sm.secs ? `, ${fmtMin(sm.secs)}` : ''}</small></h3>`;
    const items = levelItems(key);
    const chips = items.map(it => { const s = save.stats[key + ':' + it], a = avgSecs(s); return `<span class="chip-i ${mastery(s)}" title="${s ? `správně ${s.ok}×, chyb celkem ${s.bad || 0}${a !== null ? `, obvykle ${fmtSecs(a)}` : ''}` : 'nezkoušeno'}">${itemLabel(key, it)}</span>`; }).join('');
    const det = levelDetails(key).map(l => `<p class="lvl-det">${l}</p>`).join('');
    body.insertAdjacentHTML('beforeend', head + (items.length ? `<div class="chips">${chips}</div>` : '<p>Zatím nic.</p>') + det);
  });
  const recent = save.log.slice(-15).reverse();
  body.insertAdjacentHTML('beforeend', `<h3>Poslední kola</h3><div class="table-wrap"><table class="log-table"><thead><tr><th>Kdy</th><th>Patro</th><th>Bez chyby</th><th>Hodnocení</th><th>Doba</th></tr></thead><tbody>${recent.map(e => `<tr><td>${fmtDate(e.t)}</td><td>${levelName(e.level)}</td><td>${e.quit ? `odešel po ${e.done} z ${e.len}` : `${e.clean} z ${e.len}${e.ok ? '' : ' (nepovedené)'}`}</td><td>${e.rate ? e.rate + ' z 10' : '–'}</td><td>${fmtMin(e.secs)}${e.pauses ? ` (+ pauza ${fmtMin(e.pauseSecs)})` : ''}</td></tr>`).join('') || '<tr><td colspan="5">Zatím žádné kolo.</td></tr>'}</tbody></table></div>`);
  body.insertAdjacentHTML('beforeend', `<p style="margin-top:14px">${save.sync.url ? `Data se po každém kole posílají do tabulky Google${save.sync.last ? ` (naposledy ${fmtDate(save.sync.last)}${save.sync.queue.length ? `, čeká ${save.sync.queue.length} záznamů` : ''})` : ''}.` : 'Data jsou uložená jen v tomhle zařízení. Do tabulky Google je jde posílat samy (Pro rodiče, Statistiky do tabulky).'} Přehled jde i zkopírovat a poslat.</p><div class="actions"><button class="gbtn go" id="btnCopyStats">Zkopírovat přehled</button></div><textarea class="copy-out" id="copyOut" hidden readonly></textarea>`);
  $('#btnCopyStats').addEventListener('click', copyStats);
}
function statsText() {
  const lines = [`${gameName()}, přehled k ${fmtDate(Date.now())}`];
  const all = save.log.filter(e => !e.quit), rated = save.log.filter(e => e.rate);
  lines.push(`Kola: ${all.length} (povedená ${all.filter(e => e.ok).length}), hraní celkem ${fmtMin(save.log.reduce((a, e) => a + e.secs, 0))}, průměrné hodnocení ${rated.length ? fmtRate(rated.reduce((a, e) => a + e.rate, 0) / rated.length) : 'zatím žádné'}, řada dní ${streakNow().count} (nejdelší ${save.streak.best}).`);
  Object.entries(LEVELS).forEach(([key, L]) => {
    const sm = levelSummary(key); if (!sm.rounds && !sm.quit) return;
    const items = levelItems(key), by = m => items.filter(it => mastery(save.stats[key + ':' + it]) === m).map(it => itemLabel(key, it));
    lines.push(`\n${L.name}: ${kol(sm.rounds)}, povedená ${sm.ok}${sm.acc !== null ? `, bez chyby ${sm.acc} %` : ''}${sm.rate !== null ? `, hodnocení ${fmtRate(sm.rate)}` : ''}${sm.quit ? `, ${sm.quit}× odešel` : ''}, ${fmtMin(sm.secs)}.`);
    const g = by('good'), b = by('bad');
    if (g.length) lines.push(`  Zvládnuté: ${g.join(' ')}`);
    if (b.length) lines.push(`  Potíže: ${b.join(' ')}`);
    levelDetails(key).forEach(l => lines.push('  ' + l.replace(/<[^>]+>/g, '')));
  });
  const weak = practiceList();
  if (weak.length) lines.push(`\nCo procvičit: ${weak.map(w => `${itemLabel(w.level, w.item)} (${levelName(w.level).toLowerCase()}: ${w.why.join(', ')})`).join('; ')}`);
  return lines.join('\n');
}
function copyStats() {
  const text = statsText(), out = $('#copyOut');
  const fallback = () => { out.hidden = false; out.value = text; out.focus(); out.select(); };
  try { navigator.clipboard.writeText(text).then(() => { $('#btnCopyStats').textContent = 'Zkopírováno'; }, fallback); } catch (e) { fallback(); }
}

export { fmtSecs, levelDetails, practiceList, LOG_MAX, RATE_COLORS, copyStats, fmtDate, fmtMin, fmtRate, itemLabel, kol, levelItems, levelSummary, logRound, mastery, openStats, renderRate, renderStats, statsText };
