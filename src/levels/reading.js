// Čtení: slovo a obrázek
import { G } from '../core/state.js';
import { save } from '../save/save.js';
import { LETTERS, PARTNER, SAME_SOUND, SAY_LETTER, SYLL, SYL_V, VOWELS, vFam } from '../content/letters.js';
import { genMath, genNumbers, weightedPick } from './math.js';
import { genWriting } from './writing.js';
import { NAMES, genWords, lev } from '../content/words.js';

// obrázky 16 × 16; množné číslo (OSY, ÚLY…) kreslí obrázek třikrát, ať Adam čte až do konce slova
const PIC = {
  OSA: R => { R(5, 3, 3, 4, '#d6eef8'); R(8, 2, 3, 5, '#eaf7fc'); R(4, 7, 9, 5, '#f2c94c'); R(6, 7, 1, 5, '#1d1712'); R(9, 7, 1, 5, '#1d1712'); R(12, 7, 3, 4, '#1d1712'); R(13, 8, 1, 1, '#ffffff'); R(2, 9, 2, 1, '#1d1712'); R(14, 5, 1, 2, '#1d1712'); },
  OSEL: R => { R(3, 6, 9, 5, '#8d8d8d'); R(3, 11, 2, 4, '#6c6c6c'); R(10, 11, 2, 4, '#6c6c6c'); R(11, 3, 3, 5, '#8d8d8d'); R(13, 5, 3, 3, '#cfc8bc'); R(11, 0, 1, 3, '#6c6c6c'); R(13, 0, 1, 3, '#6c6c6c'); R(2, 6, 1, 4, '#5a5a5a'); R(12, 4, 1, 1, '#111111'); R(4, 10, 7, 1, '#bdbdbd'); },
  LES: R => { [[1, '#3f8a2a'], [6, '#2f7a23'], [11, '#4c9c33']].forEach(([x, c], i) => { R(x, 3 + i % 2, 4, 7, c); R(x + 1, 1 + i % 2, 2, 2, c); R(x + 1, 10, 2, 5, '#6b4a31'); }); },
  LOS: R => { R(2, 7, 10, 5, '#6b4424'); R(3, 12, 2, 4, '#4a2e17'); R(9, 12, 2, 4, '#4a2e17'); R(11, 6, 4, 4, '#6b4424'); R(13, 8, 3, 3, '#5a3820'); R(8, 2, 7, 1, '#e0d2b4'); R(8, 1, 1, 1, '#e0d2b4'); R(11, 1, 1, 1, '#e0d2b4'); R(14, 1, 1, 1, '#e0d2b4'); R(11, 3, 1, 3, '#e0d2b4'); R(12, 7, 1, 1, '#111111'); },
  ÚL: R => { R(2, 3, 12, 12, '#d8a23a'); R(2, 6, 12, 1, '#a8781e'); R(2, 11, 12, 1, '#a8781e'); R(6, 8, 4, 2, '#3a2a10'); R(10, 12, 2, 3, '#f2c94c'); R(12, 0, 3, 2, '#f2c94c'); R(13, 0, 1, 2, '#1d1712'); },
  MASO: R => { R(2, 4, 11, 9, '#c0392b'); R(2, 4, 11, 1, '#f2e4d0'); R(2, 12, 11, 1, '#f2e4d0'); R(5, 7, 2, 1, '#e8a0a0'); R(8, 9, 3, 1, '#e8a0a0'); R(12, 6, 3, 4, '#f0ebe0'); R(14, 5, 2, 2, '#f0ebe0'); R(14, 9, 2, 2, '#f0ebe0'); },
  MÍSA: R => { R(1, 7, 14, 1, '#c9a87a'); R(1, 8, 14, 2, '#8a5a2e'); R(2, 10, 12, 2, '#8a5a2e'); R(4, 12, 8, 2, '#6b4424'); R(3, 6, 10, 1, '#e8862a'); R(5, 5, 2, 1, '#e8862a'); R(9, 5, 3, 1, '#3f8a2a'); },
  SŮL: R => { R(5, 4, 6, 10, '#f4f4f4'); R(4, 4, 1, 10, '#c9c9c9'); R(11, 4, 1, 10, '#c9c9c9'); R(4, 14, 8, 1, '#c9c9c9'); R(5, 1, 6, 3, '#9a9a9a'); R(6, 2, 1, 1, '#333333'); R(9, 2, 1, 1, '#333333'); R(7, 1, 2, 1, '#333333'); R(6, 8, 4, 3, '#dfe8ef'); },
  SUM: R => { R(3, 6, 9, 5, '#7a6a52'); R(3, 10, 9, 1, '#b8a888'); R(0, 4, 3, 2, '#5e5040'); R(0, 10, 3, 2, '#5e5040'); R(1, 6, 2, 4, '#5e5040'); R(11, 6, 4, 5, '#7a6a52'); R(13, 7, 1, 1, '#111111'); R(14, 10, 2, 1, '#3a2a10'); R(14, 12, 2, 1, '#3a2a10'); R(13, 11, 1, 1, '#3a2a10'); R(6, 4, 3, 2, '#5e5040'); },
  LAMA: R => { const W = '#efe4c8'; R(2, 8, 9, 4, W); R(2, 12, 2, 4, W); R(9, 12, 2, 4, W); R(9, 2, 3, 7, W); R(10, 1, 4, 3, W); R(10, 0, 1, 1, W); R(12, 0, 1, 1, W); R(12, 2, 1, 1, '#111111'); R(4, 8, 4, 2, '#c62f2f'); R(4, 10, 4, 1, '#2f7fd1'); R(1, 8, 1, 2, W); },
  SLÁMA: R => { R(1, 3, 14, 12, '#d8b84a'); [3, 6, 9, 12].forEach(x => R(x, 3, 1, 12, '#b8962a')); R(1, 6, 14, 1, '#8a2a17'); R(1, 11, 14, 1, '#8a2a17'); R(1, 3, 14, 1, '#ead27a'); },
  MÁMA: R => { const S = '#d9a066'; R(5, 0, 6, 2, '#6b3a1a'); R(6, 1, 4, 4, S); R(5, 2, 1, 5, '#6b3a1a'); R(10, 2, 1, 5, '#6b3a1a'); R(7, 2, 1, 1, '#2f5ea8'); R(9, 2, 1, 1, '#2f5ea8'); R(7, 4, 2, 1, '#c0392b'); R(4, 5, 8, 7, '#c84a8a'); R(3, 6, 1, 5, S); R(12, 6, 1, 5, S); R(3, 11, 10, 1, '#a83a72'); R(6, 12, 1, 3, S); R(9, 12, 1, 3, S); R(5, 15, 2, 1, '#333333'); R(9, 15, 2, 1, '#333333'); },
};
const PLURAL = { OSY: 'OSA', ÚLY: 'ÚL', LAMY: 'LAMA', MÍSY: 'MÍSA' };
const PIC_WORDS = [...Object.keys(PIC), ...Object.keys(PLURAL)];
function picCanvas(word) {
  const one = document.createElement('canvas'); one.width = one.height = 16;
  const g1 = one.getContext('2d'); PIC[PLURAL[word] || word]((x, y, w, h, c) => { g1.fillStyle = c; g1.fillRect(x, y, w, h); });
  const c = document.createElement('canvas'); c.width = c.height = 32; c.className = 'pic px';
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (PLURAL[word]) { g.drawImage(one, 0, 15); g.drawImage(one, 16, 15); g.drawImage(one, 8, 1); }
  else g.drawImage(one, 0, 0, 32, 32);
  return c;
}
// nejdřív jen jednotné číslo, po 3 povedených kolech i OSY, ÚLY, LAMY, MÍSY
function genReading() {
  const r = save.rounds.reading;
  const pool = r < 3 ? Object.keys(PIC) : PIC_WORDS;
  const avoid = G.R.recent.slice(-3);
  const w = weightedPick(pool.filter(x => !avoid.includes(x)), x => weight('reading', x));
  const others = pool.filter(x => x !== w).map(x => [x, lev(w, x) + Math.random() * 1.5]).sort((a, b) => a[1] - b[1]).slice(0, choiceCount('reading') - 1).map(x => x[0]);
  return { answer: w, choices: shuffle([w, ...others]), say: 'Přečti slovo.', task: display(w), stat: 'reading:' + w, key: w, picture: true, after: `Je to ${w.toLocaleLowerCase('cs')}.` };
}

const LEVELS = {
  letters: { name: 'Písmena', tex: 'dirt', items: LETTERS, sample: ['A', 'm'], intro: 'Poslouchej a kopej do správného písmenka.' },
  syllables: { name: 'Slabiky', tex: 'stone', items: SYLL, sample: ['MA', 'lo'], small: true, intro: 'Poslouchej a kopej do správné slabiky.' },
  words: { name: 'Slova', tex: 'ironOre', gen: genWords, sample: ['MÁMA'], small: true, intro: 'Poslouchej slovo a kopej do správné kostky.' },
  reading: { name: 'Čtení', tex: 'diamondOre', gen: genReading, picture: true, sample: ['OSA'], small: true, intro: 'Přečti slovo na ceduli a kopni do správného obrázku.' },
  numbers: { name: 'Čísla', tex: 'goldOre', gen: genNumbers, sample: ['3', '7'], intro: 'Poslouchej číslo a kopej do správné kostky.' },
  math: { name: 'Počty', tex: 'lapisOre', gen: genMath, sample: ['2+3'], small: true, intro: 'Spočítej příklad a kopej do správného výsledku.' },
  writing: { name: 'Psaní', tex: 'redstoneOre', trace: genWriting, len: 5, sample: ['1 A'], intro: 'Jeď prstem po dráze a nevyjeď z ní. Začni u zelené tečky a jeď po šipce.' },
};
// slabiky a slova v krátké české větě: samotné "me", "so", "sum" čte český hlas jako anglická slova (mí, sou, sam)
const inCzech = (kind, t) => `${kind} ${t.toLocaleLowerCase('cs')}.`;
function sayText(level, it) { return level === 'letters' ? SAY_LETTER[it] : inCzech('Slabika', it); }
// dvě kostky, které znějí stejně (I a Y, Ú a Ů), nesmí být v jednom úkolu
function conflict(level, a, b) {
  if (level === 'letters') return (SAME_SOUND[a] || a) === (SAME_SOUND[b] || b);
  const fa = vFam(a[1]), fb = vFam(b[1]);
  return a[0] === b[0] && fa && fb && fa !== fb;
}
function partnerOf(level, it) {
  if (level === 'letters') return PARTNER[it] || null;
  const p = PARTNER[it[1]]; return p && SYL_V.includes(p) ? it[0] + p : null;
}
function similar(level, a, b) {
  if (level === 'letters') return VOWELS.has(a) === VOWELS.has(b);
  return a[0] === b[0] || a[1] === b[1];
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function weight(level, it) { const s = save.stats[level + ':' + it] || { ok: 0, miss: 0 }; return Math.max(.5, Math.min(5, 1 + s.miss * 1.5 - s.ok * .25)); }
function pickTarget(level, avoid) {
  const items = LEVELS[level].items.filter(x => !avoid.includes(x));
  const ws = items.map(x => weight(level, x)); let t = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; }
  return items[items.length - 1];
}
function choiceCount(level) { const r = save.rounds[level]; return r < 2 ? 2 : r < 5 ? 3 : 4; }
function makeChoices(level, target, n) {
  const chosen = [target];
  const ok = x => !chosen.includes(x) && !chosen.some(c => conflict(level, c, x));
  const p = partnerOf(level, target);
  if (p && ok(p) && Math.random() < Math.min(.75, .35 + save.rounds[level] * .08)) chosen.push(p);
  for (const x of shuffle(LEVELS[level].items.filter(x => similar(level, target, x)))) { if (chosen.length >= n) break; if (ok(x) && Math.random() < .7) chosen.push(x); }
  for (const x of shuffle(LEVELS[level].items.slice())) { if (chosen.length >= n) break; if (ok(x)) chosen.push(x); }
  return shuffle(chosen);
}
function display(it) {
  const m = save.caseMode;
  const lower = m === 'lower' || (m === 'both' && Math.random() < .5);
  if (!lower) return it;
  const low = it.toLocaleLowerCase('cs');
  return NAMES.includes(it) ? it[0] + low.slice(1) : low; // jména s velkým písmenem
}

export { LEVELS, PIC, PIC_WORDS, PLURAL, choiceCount, conflict, display, genReading, inCzech, makeChoices, partnerOf, picCanvas, pickTarget, sayText, shuffle, similar, weight };
