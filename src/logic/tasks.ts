// Generátory úkolů pro všechna patra. Čistá logika: dostanou stav (kola, statistiky, nedávné úkoly) a náhodu.
import { LETTERS, PARTNER, SAME_SOUND, SAY_LETTER, SYLL, SYL_V, VOWELS, sylC, sylV, vFam } from '../content/letters';
import { WORDS } from '../content/words';
import { PIC_PART, PIC_WORDS } from '../content/pictures';
import { SHAPE_NAMES } from '../content/glyphs';
import { choiceCount, mastery, weight, type Stats } from './mastery';
import { range, rnd, shuffle, weightedPick, type Rng } from './random';
import { pronounce } from './pronounce';
import { lettersOf } from './letters';
import { mathTop, CROSSING_READY, CROSSING_SHARE, WRITING_ALL, WRITING_EASY, WRITING_HARD, crossingReady, isCrossing, stageItems, stageOf } from './stages';
export { CROSSING_READY, CROSSING_SHARE, WRITING_ALL, WRITING_EASY, WRITING_HARD, crossingReady, isCrossing };

// force = úloha daná předem (procvičování): generátor ji použije místo náhodného výběru
// stages = dosažené stupně obtížnosti (save.stages, logic/stages.ts); rounds řídí jen počet kostek
export interface Ctx { rounds: Record<string, number>; stats: Stats; recent: string[]; rng?: Rng; pron?: Record<string, string>; force?: string; stages?: Record<string, number> }
const stage = (level: string, ctx: Ctx) => stageOf(level, ctx.stats, ctx.stages);
// úlohy otevřené v dosaženém stupni patra
export const openItems = (level: string, ctx: Ctx): string[] => stageItems(level, stage(level, ctx));
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
  const fa = vFam(sylV(a)), fb = vFam(sylV(b));
  return sylC(a) === sylC(b) && !!fa && !!fb && fa !== fb;
}
export function partnerOf(level: string, it: string): string | null {
  if (level === 'letters') return PARTNER[it] || null;
  const p = PARTNER[sylV(it)]; return p && SYL_V.includes(p) ? sylC(it) + p : null;
}
export function similar(level: string, a: string, b: string): boolean {
  if (level === 'letters') return VOWELS.has(a) === VOWELS.has(b);
  return sylC(a) === sylC(b) || sylV(a) === sylV(b);
}
export function pickTarget(level: string, ctx: Ctx): string {
  if (ctx.force && ITEMS[level].includes(ctx.force)) return ctx.force;
  const avoid = ctx.recent.slice(-2);
  return weightedPick(openItems(level, ctx).filter(x => !avoid.includes(x)), x => weight(ctx.stats, level, x), ctx.rng);
}
export function makeChoices(level: string, target: string, ctx: Ctx): string[] {
  const rng = ctx.rng || Math.random, n = choiceCount(ctx.rounds[level] || 0);
  // kostky jen z otevřeného stupně (neznámé písmeno by bylo nápověda), u procvičování případně i z celého patra
  const open = openItems(level, ctx), pool = open.includes(target) ? open : ITEMS[level];
  const chosen = [target];
  const ok = (x: string) => !chosen.includes(x) && !chosen.some(c => conflict(level, c, x));
  const p = partnerOf(level, target);
  if (p && pool.includes(p) && ok(p) && rng() < Math.min(.75, .35 + (ctx.rounds[level] || 0) * .08)) chosen.push(p);
  for (const x of shuffle(pool.filter(x => similar(level, target, x)), rng)) { if (chosen.length >= n) break; if (ok(x) && rng() < .7) chosen.push(x); }
  for (const x of shuffle(pool.slice(), rng)) { if (chosen.length >= n) break; if (ok(x)) chosen.push(x); }
  return shuffle(chosen, rng);
}
// „Na jaké písmeno začíná slovo…?“ (jako v pracovním sešitě k Živé abecedě: rozliš hlásku na začátku slova),
// v patře Písmena od 3. kola asi každý čtvrtý úkol; slovo jen ze zapnutých písmen, počáteční písmeno z otevřeného stupně
export const FIRST_SOUND_SHARE = .25, FIRST_SOUND_FROM = 2;
export function genFirstSound(ctx: Ctx): Task | null {
  const rng = ctx.rng || Math.random, open = openItems('letters', ctx);
  const cands = WORDS.filter(w => open.includes(lettersOf(w)[0]) && !ctx.recent.includes('z' + w));
  if (!cands.length) return null;
  const w = cands[Math.floor(rng() * cands.length)], t = lettersOf(w)[0];
  const said = pronounce(w, ctx.pron);
  return { answer: t, choices: makeChoices('letters', t, ctx), say: `Na jaké písmeno začíná slovo ${said}?`, stat: 'letters:' + t, key: 'z' + w, after: `Ano, ${said} začíná na ${SAY_LETTER[t]}.` };
}
export function genLetters(level: string, ctx: Ctx): Task {
  const t = pickTarget(level, ctx);
  if (level === 'letters' && !ctx.force && (ctx.rounds.letters || 0) >= FIRST_SOUND_FROM && (ctx.rng || Math.random)() < FIRST_SOUND_SHARE) { const fs = genFirstSound(ctx); if (fs) return fs; }
  return { answer: t, choices: makeChoices(level, t, ctx), say: sayText(level, t, ctx.pron), stat: level + ':' + t, key: t };
}

/* ---------- čísla a počty ---------- */
// správná odpověď + podobné (o jedna vedle, prohozené číslice…) + doplnit náhodnými
// must = možnosti, které se mají objevit vždy (chytáky, třeba prohozené číslice)
export function pickChoices(ans: number, near: number[], pool: number[], k: number, rng: Rng = Math.random, must: number[] = []): number[] {
  const out = [ans, ...must.filter(x => x !== ans && pool.includes(x)).slice(0, k - 1)];
  for (const x of shuffle(near.filter(x => pool.includes(x) && x !== ans), rng)) { if (out.length >= k) break; if (!out.includes(x) && rng() < .8) out.push(x); }
  for (const x of shuffle(pool.slice(), rng)) { if (out.length >= k) break; if (!out.includes(x)) out.push(x); }
  return shuffle(out, rng);
}
// čísla: do 10, po 3 povedených kolech do 20, po 7 do 100
export function genNumbers(ctx: Ctx): Task {
  const r = ctx.rounds.numbers || 0, forced = ctx.force !== undefined && /^\d+$/.test(ctx.force) ? Number(ctx.force) : -1;
  const max = Math.max(openItems('numbers', ctx).length - 1, forced > 50 ? 100 : forced > 20 ? 50 : forced > 10 ? 20 : 0);
  const pool = range(0, max), avoid = ctx.recent.slice(-3);
  const n = forced >= 0 ? forced : weightedPick(pool.filter(x => !avoid.includes('n' + x)), x => weight(ctx.stats, 'numbers', String(x)), ctx.rng);
  const rev = n > 9 ? Number(String(n).split('').reverse().join('')) : -1;
  const near = [n - 1, n + 1, n - 10, n + 10, rev, n === 6 ? 9 : n === 9 ? 6 : -1];
  // chytáky (Ondřej 20. 10. 2026, chyby 21/12, 84/94, 83/73): u dvojciferných skoro vždy prohozené číslice a často sousední desítka
  const rng = ctx.rng || Math.random, must: number[] = [];
  if (rev > 9 && rev !== n && rng() < .85) must.push(rev);
  if (n > 10 && rng() < .6) must.push(rng() < .5 ? n + 10 : n - 10);
  return { answer: String(n), choices: pickChoices(n, near, pool, choiceCount(r), rng, must).map(String), say: String(n), stat: 'numbers:' + n, key: 'n' + n };
}
// příklady podle stupně (logic/stages.ts): do 10; do 20 bez přechodu; pak přechod přes desítku (menšina příkladů) a celé desítky do 100
// jako v Adamově Matematice 1 (ALTER): „Porovnej“ (znaménka <, =, >) a „Doplň“ (2 + ? = 5); v prvních dvou stupních
// asi každý pátý úkol jedno, každý pátý druhé
export const COMPARE_SHARE = .2, MISSING_SHARE = .2;
const CMP_WORD: Record<string, string> = { '<': 'je menší než', '=': 'se rovná', '>': 'je větší než' };
export function genCompare(ctx: Ctx, top: number): Task {
  const rng = ctx.rng || Math.random;
  let x = 0, y = 0, tries = 0;
  do { x = rnd(0, top, rng); y = rng() < .2 ? x : rnd(0, top, rng); } while (ctx.recent.includes(`c${x}-${y}`) && ++tries < 20);
  const ans = x < y ? '<' : x > y ? '>' : '=';
  return { answer: ans, choices: ['<', '=', '>'], say: `Porovnej: ${x} a ${y}. Které znaménko patří mezi ně?`, task: `${x} ? ${y}`, stat: `math:${x}${ans}${y}`, key: `c${x}-${y}`, after: `Ano, ${x} ${CMP_WORD[ans]} ${y}.` };
}
export function genMissing(ctx: Ctx, top: number): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.math || 0;
  let a = 0, b = 0, s = 0, tries = 0;
  do { s = rnd(2, top, rng); a = rnd(1, s - 1, rng); b = s - a; } while (ctx.recent.includes(`d${a}+${s}`) && ++tries < 20);
  return { answer: String(b), choices: pickChoices(b, [b + 1, b - 1, s, a], range(0, top), choiceCount(r), rng).map(String), say: `${a} plus kolik je ${s}?`, task: `${a} + ? = ${s}`, stat: `math:${a}+?=${s}`, key: `d${a}+${s}`, after: `Ano, ${a} plus ${b} je ${s}.` };
}
export function genMath(ctx: Ctx): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.math || 0, st = stage('math', ctx);
  if (!ctx.force && st < 2) {
    const top = mathTop(ctx.stats, st), v = rng();
    if (v < COMPARE_SHARE) return genCompare(ctx, top);
    if (v < COMPARE_SHARE + MISSING_SHARE) return genMissing(ctx, top);
  }
  let a = 0, b = 0, op = '+', key = '', tens = false, tries = 0;
  const fm = ctx.force ? /^(\d+)([+-])(\d+)$/.exec(ctx.force) : null;
  if (fm) { a = +fm[1]; op = fm[2]; b = +fm[3]; key = ctx.force!; tens = a % 10 === 0 && b % 10 === 0 && Math.max(a, b, op === '+' ? a + b : a) > 20; }
  else {
  // přechod i celé desítky se losují jednou před hledáním příkladu (při opakovaném losování by desítky přechod přebily)
  const crossOk = st >= 2 && rng() < CROSSING_SHARE;
  tens = st >= 2 && !crossOk && rng() < .4;
  do {
    op = rng() < .5 ? '+' : '-';
    const max = mathTop(ctx.stats, st);
    if (tens) { if (op === '+') { a = rnd(1, 9, rng) * 10; b = rnd(1, 10 - a / 10, rng) * 10; } else { a = rnd(2, 10, rng) * 10; b = rnd(1, a / 10 - 1, rng) * 10; } }
    else if (op === '+') { a = rnd(0, max - 1, rng); b = rnd(0, max - a, rng); }
    else { a = rnd(1, max, rng); b = rnd(0, a, rng); }
    key = a + op + b;
  } while ((ctx.recent.includes(key) || ((a === 0 || b === 0) && rng() < .8) || (!tens && isCrossing(a, op, b) !== crossOk && tries < 35)) && ++tries < 40);
  }
  const ans = op === '+' ? a + b : a - b, step = tens ? 10 : 1;
  const pool = tens ? range(0, 100, 10) : range(0, Math.max(mathTop(ctx.stats, st), a, ans));
  const near = [ans + step, ans - step, ans + 2 * step, ans - 2 * step, op === '+' ? a - b : a + b];
  return { answer: String(ans), choices: pickChoices(ans, near, pool, choiceCount(r), rng).map(String), say: `Kolik je ${a} ${op === '+' ? 'plus' : 'mínus'} ${b}?`, task: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`, stat: 'math:' + key, key };
}

/* ---------- slova a čtení ---------- */
function similarWords(w: string, pool: string[], k: number, rng: Rng): string[] {
  return pool.filter(x => x !== w).map(x => [x, lev(w, x) + rng() * 1.5] as [string, number]).sort((a, b) => a[1] - b[1]).slice(0, k).map(x => x[0]);
}
// slova podle stupně: do 3 písmen, do 4, všechna; na výběr nejpodobnější slova (LES a LOS, MALÝ a MALÁ)
export function genWords(ctx: Ctx): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.words || 0;
  const avoid = ctx.recent.slice(-4);
  const w = ctx.force && WORDS.includes(ctx.force) ? ctx.force : weightedPick(openItems('words', ctx).filter(x => !avoid.includes(x)), x => weight(ctx.stats, 'words', x), rng);
  return { answer: w, choices: shuffle([w, ...similarWords(w, WORDS, choiceCount(r) - 1, rng)], rng), say: pronounce(w, ctx.pron), stat: 'words:' + w, key: w };
}
// slovo jen napsané na ceduli, výběr obrázku; ve druhém stupni i množné číslo
export function genReading(ctx: Ctx): Task {
  const rng = ctx.rng || Math.random, r = ctx.rounds.reading || 0;
  const forced = ctx.force && PIC_WORDS.includes(ctx.force) ? ctx.force : '';
  const open = openItems('reading', ctx), pool = forced && !open.includes(forced) ? PIC_WORDS : open;
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
// stupně (logic/stages.ts): číslice 1 až 5, I, L, O a snadné cviky; pak všechny číslice a písmena; nakonec smyčka a spirála
export function genWriting(ctx: Ctx): string {
  const pool = openItems('writing', ctx).filter(c => !ctx.recent.slice(-3).includes(c));
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
