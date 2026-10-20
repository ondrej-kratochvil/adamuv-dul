// Generátory úkolů pro všechna patra. Čistá logika: dostanou stav (kola, statistiky, nedávné úkoly) a náhodu.
import { LETTERS, PARTNER, SAME_SOUND, SAY_LETTER, SYLL, SYL_V, VOWELS, vFam } from '../content/letters';
import { WORDS } from '../content/words';
import { PIC, PIC_PART, PIC_WORDS } from '../content/pictures';
import { SHAPE_NAMES } from '../content/glyphs';
import { choiceCount, mastery, weight, type Stats } from './mastery';
import { range, rnd, shuffle, weightedPick, type Rng } from './random';
import { pronounce } from './pronounce';

// force = úloha daná předem (procvičování): generátor ji použije místo náhodného výběru
export interface Ctx { rounds: Record<string, number>; stats: Stats; recent: string[]; rng?: Rng; pron?: Record<string, string>; force?: string }
export interface Task { answer: string; choices: string[]; say: string; stat: string; key: string; task?: string; picture?: boolean; after?: string }

// slabiky a slova pro hlas: viz logic/pronounce.ts (věta „Slabika so.“ výslovnost nespravila, proto pryč)
export { pronounce };

// editační vzdálenost dvou slov (kolik písmen je potřeba změnit)
export function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/* ---------- písmena a slabiky ---------- */
export const ITEMS: Record<string, string[]> = { letters: LETTERS, syllables: SYLL };
export const sayText = (level: string, it: string, pron: Record<string, string> = {}): string => level === 'letters' ? SAY_LETTER[it] : pronounce(it, pron);

// dvě kostky, které znějí stejně (I a Y, Ú a Ů), nesmí být v jednom úkolu
export function conflict(level: string, a: string, b: string): boolean {
  if (level === 'letters') return (SAME_SOUND[a] || a) === (SAME_SOUND[b] || b);
  const fa = vFam(a[1]), fb = vFam(b[1]);
  return a[0] === b[0] && !!fa && !!fb && fa !== fb;
}
export function partnerOf(level: string, it: string): string | null {
  if (level === 'letters') return PARTNER[it] || null;
  const p = PARTNER[it[1]]; return p && SYL_V.includes(p) ? it[0] + p : null;
}
export function similar(level: string, a: string, b: string): boolean {
  if (level === 'letters') return VOWELS.has(a) === VOWELS.has(b);
  return a[0] === b[0] || a[1] === b[1];
}
export function pickTarget(level: string, ctx: Ctx): string {
  if (ctx.force && ITEMS[level].includes(ctx.force)) return ctx.force;
  const avoid = ctx.recent.slice(-2);
  return weightedPick(ITEMS[level].filter(x => !avoid.includes(x)), x => weight(ctx.stats, level, x), ctx.rng);
}
export function makeChoices(level: string, target: string, ctx: Ctx): string[] {
  const rng = ctx.rng || Math.random, n = choiceCount(ctx.rounds[level] || 0);
  const chosen = [target];
  const ok = (x: string) => !chosen.includes(x) && !chosen.some(c => conflict(level, c, x));
  const p = partnerOf(level, target);
  if (p && ok(p) && rng() < Math.min(.75, .35 + (ctx.rounds[level] || 0) * .08)) chosen.push(p);
  for (const x of shuffle(ITEMS[level].filter(x => similar(level, target, x)), rng)) { if (chosen.length >= n) break; if (ok(x) && rng() < .7) chosen.push(x); }
  for (const x of shuffle(ITEMS[level].slice(), rng)) { if (chosen.length >= n) break; if (ok(x)) chosen.push(x); }
  return shuffle(chosen, rng);
}
export function genLetters(level: string, ctx: Ctx): Task {
  const t = pickTarget(level, ctx);
  return { answer: t, choices: makeChoices(level, t, ctx), say: sayText(level, t, ctx.pron), stat: level + ':' + t, key: t };
}

/* ---------- čísla a počty ---------- */
// správná odpověď + podobné (o jedna vedle, prohozené číslice…) + doplnit náhodnými
export function pickChoices(ans: number, near: number[], pool: number[], k: number, rng: Rng = Math.random): number[] {
  const out = [ans];
  for (const x of shuffle(near.filter(x => pool.includes(x) && x !== ans), rng)) { if (out.length >= k) break; if (!out.includes(x) && rng() < .8) out.push(x); }
  for (const x of shuffle(pool.slice(), rng)) { if (out.length >= k) break; if (!out.includes(x)) out.push(x); }
  return shuffle(out, rng);
}
// čísla: do 10, po 3 povedených kolech do 20, po 7 do 100
export function genNumbers(ctx: Ctx): Task {
  const r = ctx.rounds.numbers || 0, forced = ctx.force !== undefined && /^\d+$/.test(ctx.force) ? Number(ctx.force) : -1;
  const max = Math.max(r < 3 ? 10 : r < 7 ? 20 : 100, forced > 20 ? 100 : forced > 10 ? 20 : 0);
  const pool = range(0, max), avoid = ctx.recent.slice(-3);
  const n = forced >= 0 ? forced : weightedPick(pool.filter(x => !avoid.includes('n' + x)), x => weight(ctx.stats, 'numbers', String(x)), ctx.rng);
  const rev = n > 9 ? Number(String(n).split('').reverse().join('')) : -1;
  const near = [n - 1, n + 1, n - 10, n + 10, rev, n === 6 ? 9 : n === 9 ? 6 : -1];
  return { answer: String(n), choices: pickChoices(n, near, pool, choiceCount(r), ctx.rng).map(String), say: String(n), stat: 'numbers:' + n, key: 'n' + n };
}
// Přechod přes desítku (8 + 7, 16 − 9) až po zvládnutí počítání do 20 bez přechodu (Ondřej 20. 10. 2026, jako ve škole):
// aspoň 10 zvládnutých příkladů v druhé desítce bez přechodu; pak přechod jen u menšiny příkladů.
export const CROSSING_READY = 10, CROSSING_SHARE = .3;
export function isCrossing(a: number, op: string, b: number): boolean {
  if (op === '+') return a % 10 + b % 10 > 10;
  return a > 10 && a % 10 !== 0 && a % 10 < b % 10;
}
const parseMath = (k: string) => { const m = /^(\d+)([+-])(\d+)$/.exec(k); return m ? { a: +m[1], op: m[2], b: +m[3] } : null; };
export function crossingReady(stats: Stats): boolean {
  let n = 0;
  for (const [k, s] of Object.entries(stats)) {
    if (!k.startsWith('math:') || mastery(s) !== 'good') continue;
    const p = parseMath(k.slice(5)); if (!p) continue;
    const top = Math.max(p.a, p.b, p.op === '+' ? p.a + p.b : p.a);
    if (top > 10 && top <= 20 && !isCrossing(p.a, p.op, p.b)) n++;
  }
  return n >= CROSSING_READY;
}
// příklady: do 10, po 3 povedených kolech do 20 (přechod přes desítku viz výše), po 7 i celé desítky do 100
export function genMath(ctx: Ctx): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.math || 0;
  let a = 0, b = 0, op = '+', key = '', tens = false, tries = 0;
  const fm = ctx.force ? /^(\d+)([+-])(\d+)$/.exec(ctx.force) : null;
  if (fm) { a = +fm[1]; op = fm[2]; b = +fm[3]; key = ctx.force!; tens = a % 10 === 0 && b % 10 === 0 && Math.max(a, b, op === '+' ? a + b : a) > 20; }
  else {
  const crossOk = r >= 3 && crossingReady(ctx.stats) && rng() < CROSSING_SHARE;
  do {
    op = rng() < .5 ? '+' : '-';
    tens = r >= 7 && rng() < .4;
    const max = r < 3 ? 10 : 20;
    if (tens) { if (op === '+') { a = rnd(1, 9, rng) * 10; b = rnd(1, 10 - a / 10, rng) * 10; } else { a = rnd(2, 10, rng) * 10; b = rnd(1, a / 10 - 1, rng) * 10; } }
    else if (op === '+') { a = rnd(0, max - 1, rng); b = rnd(0, max - a, rng); }
    else { a = rnd(1, max, rng); b = rnd(0, a, rng); }
    key = a + op + b;
  } while ((ctx.recent.includes(key) || ((a === 0 || b === 0) && rng() < .8) || (!tens && isCrossing(a, op, b) !== crossOk && tries < 35)) && ++tries < 40);
  }
  const ans = op === '+' ? a + b : a - b, step = tens ? 10 : 1;
  const pool = tens ? range(0, 100, 10) : range(0, Math.max(r < 3 ? 10 : 20, a, ans));
  const near = [ans + step, ans - step, ans + 2 * step, ans - 2 * step, op === '+' ? a - b : a + b];
  return { answer: String(ans), choices: pickChoices(ans, near, pool, choiceCount(r), rng).map(String), say: `Kolik je ${a} ${op === '+' ? 'plus' : 'mínus'} ${b}?`, task: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`, stat: 'math:' + key, key };
}

/* ---------- slova a čtení ---------- */
function similarWords(w: string, pool: string[], k: number, rng: Rng): string[] {
  return pool.filter(x => x !== w).map(x => [x, lev(w, x) + rng() * 1.5] as [string, number]).sort((a, b) => a[1] - b[1]).slice(0, k).map(x => x[0]);
}
// slova do 3 písmen, po 3 povedených kolech do 4, po 6 všechna; na výběr nejpodobnější slova (LES a LOS, MALÝ a MALÁ)
export function genWords(ctx: Ctx): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.words || 0, maxLen = r < 3 ? 3 : r < 6 ? 4 : 9;
  const avoid = ctx.recent.slice(-4);
  const w = ctx.force && WORDS.includes(ctx.force) ? ctx.force : weightedPick(WORDS.filter(x => x.length <= maxLen && !avoid.includes(x)), x => weight(ctx.stats, 'words', x), rng);
  return { answer: w, choices: shuffle([w, ...similarWords(w, WORDS, choiceCount(r) - 1, rng)], rng), say: pronounce(w, ctx.pron), stat: 'words:' + w, key: w };
}
// slovo jen napsané na ceduli, výběr obrázku; po 3 kolech i množné číslo
export function genReading(ctx: Ctx): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.reading || 0;
  const forced = ctx.force && PIC_WORDS.includes(ctx.force) ? ctx.force : '';
  const pool = r < 3 && !(forced && !PIC[forced]) ? Object.keys(PIC) : PIC_WORDS;
  const avoid = ctx.recent.slice(-3);
  const w = forced || weightedPick(pool.filter(x => !avoid.includes(x)), x => weight(ctx.stats, 'reading', x), rng);
  return { answer: w, choices: shuffle([w, ...similarWords(w, pool, choiceCount(r) - 1, rng)], rng), say: 'Přečti slovo.', task: w, stat: 'reading:' + w, key: w, picture: true, after: readingAfter(w) };
}

// po správné odpovědi celé slovo; u části slova i to, co bylo na ceduli
export function readingAfter(w: string): string {
  const low = w.toLocaleLowerCase('cs'), p = PIC_PART[w];
  return p ? `Je to ${p.full}. Na ceduli byl jen kousek slova: ${low}.` : `Je to ${low}.`;
}

/* ---------- psaní ---------- */
// Nejdřív číslice 1 až 5, I, L, O a snadné cviky (vlnka, cikcak, kopečky). Od 3. kola všechny číslice a písmena,
// smyčka a spirála až od 8. povedeného kola (smyčka Adamovi 19. 10. 2026 nešla: 0 ze 2 a odešel z kola).
export const WRITING_EASY = ['1', '2', '3', '4', '5', 'I', 'L', 'O', 'vlnka', 'cikcak', 'kopecky'];
export const WRITING_HARD = ['smycka', 'spirala'];
export const WRITING_HARD_FROM = 8;
export const WRITING_ALL = [...'0123456789', ...'AEIOUYMLS', ...Object.keys(SHAPE_NAMES)];
export function writingPool(rounds: number): string[] {
  if (rounds < 3) return WRITING_EASY;
  return rounds < WRITING_HARD_FROM ? WRITING_ALL.filter(c => !WRITING_HARD.includes(c)) : WRITING_ALL;
}
export function genWriting(ctx: Ctx): string {
  const pool = writingPool(ctx.rounds.writing || 0).filter(c => !ctx.recent.slice(-3).includes(c));
  // váha z chyb nejvýš 2: když se cvik nedaří, má se vracet, ale ne pořád dokola
  return weightedPick(pool, c => Math.min(2, weight(ctx.stats, 'writing', c)), ctx.rng);
}
export const writingSay = (ch: string): string => SHAPE_NAMES[ch] ? `Obtáhni ${SHAPE_NAMES[ch]}.` : /\d/.test(ch) ? `Napiš číslo ${ch}.` : `Napiš písmeno ${SAY_LETTER[ch]}.`;

/* ---------- procvičování ---------- */
// úkol pro danou slabou úlohu (logic/practice.ts); kostky na výběr stejně jako v patře
export function genPracticeTask(level: string, item: string, ctx: Ctx): Task {
  const c = { ...ctx, force: item };
  if (level === 'letters' || level === 'syllables') return genLetters(level, c);
  if (level === 'words') return genWords(c);
  if (level === 'reading') return genReading(c);
  if (level === 'numbers') return genNumbers(c);
  return genMath(c);
}
