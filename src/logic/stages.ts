// Stupně obtížnosti v patrech (Ondřej 24. 10. 2026): obsah přibývá podle toho, co Adam zvládl, ne podle počtu kol.
// Další stupeň se otevře, až je zvládnuto aspoň 70 % úloh všech dosud otevřených stupňů. Dosažený stupeň se
// pamatuje (save.stages) a nezavře se, ani když nějaká úloha přestane být zvládnutá.
import { WORDS } from '../content/words';
import { PIC, PIC_WORDS } from '../content/pictures';
import { PAIRS, SOUNDS, SPEECH_WORDS } from '../content/speech';
import { WRITING_ITEMS } from '../content/glyphs';
import { CONS, LETTERS, SYLL } from '../content/letters';
import { mastery, type Stats } from './mastery';
import { fitsPair } from './speech';
import { range } from './random';

export const STAGE_SHARE = .7;

// psaní: nejdřív číslice 1 až 5, I, L, O a snadné cviky; smyčka a spirála až nakonec (smyčka Adamovi 19. 10. 2026 nešla)
export const WRITING_EASY = ['1', '2', '3', '4', '5', 'I', 'L', 'O', 'vlnka', 'cikcak', 'kopecky'];
export const WRITING_HARD = ['smycka', 'spirala'];
export const WRITING_ALL = WRITING_ITEMS; // číslice, zapnutá písmena a cviky (logic/letters.ts applyLetters)

const lettersOf = (s: string) => s.split(' ');
const syll = (cons: string[], vowels: string) => cons.flatMap(c => vowels.split(' ').map(v => c + v));
const upTo = (n: number) => range(0, n).map(String);
const wordsUpTo = (len: number) => WORDS.filter(w => w.length <= len);
const speechWords = (pairs: [string, string][]) => SPEECH_WORDS.filter(w => pairs.some(p => fitsPair(w, p))).map(w => w.w);

// úlohy každého stupně (souhrnně: stupeň k obsahuje i všechno ze stupňů před ním); name = co se otevřelo (pro hlas)
export interface Stage { items: string[]; name: string }
export const STAGES: Record<string, Stage[]> = {
  letters: [
    { items: lettersOf('A E I O U'), name: '' },
    { items: lettersOf('A E I O U Á É Í Ó Ú'), name: 'dlouhá písmena Á, É, Í, Ó, Ú' },
    { items: lettersOf('A E I O U Á É Í Ó Ú Y Ý Ů'), name: 'písmena Y, dlouhé Ý a Ů s kroužkem' },
    // poslední stupeň = všechna písmena zapnutá rodičem (Schoolcraft; Adam: M, L, S a P)
    { get items() { return LETTERS; }, get name() { return `písmena ${CONS.join(', ')}`; } },
  ],
  syllables: [
    { items: syll(['M'], 'A E I O U'), name: '' },
    { items: syll(['M', 'L', 'S'], 'A E I O U'), name: 'slabiky s L a S' },
    { get items() { return SYLL; }, name: 'dlouhé slabiky a slabiky s Y' }, // všechny slabiky ze zapnutých písmen
  ],
  numbers: [
    { items: upTo(10), name: '' },
    { items: upTo(20), name: 'čísla do dvaceti' },
    { items: upTo(50), name: 'čísla do padesáti' },
    { items: upTo(100), name: 'čísla do sta' },
  ],
  words: [
    { items: wordsUpTo(3), name: '' },
    { items: wordsUpTo(4), name: 'slova se čtyřmi písmeny' },
    { items: WORDS, name: 'dlouhá slova' },
  ],
  reading: [
    { get items() { return PIC_WORDS.filter(w => PIC[w]); }, name: '' }, // jen slova ze zapnutých písmen
    { get items() { return PIC_WORDS; }, name: 'slova, kde je víc věcí, třeba lamy' },
  ],
  writing: [
    { items: WRITING_EASY, name: '' },
    { get items() { return WRITING_ALL.filter(c => !WRITING_HARD.includes(c)); }, name: 'všechny číslice a písmena' },
    { get items() { return WRITING_ALL; }, name: 'smyčka a spirála' },
  ],
  speech: PAIRS.map((p, i) => ({ items: speechWords(PAIRS.slice(0, i + 1)), name: i ? `hlásky ${p.join(' a ')} (${SOUNDS[p[0]].hint}, ${SOUNDS[p[1]].hint})` : '' })),
  math: [
    { items: [], name: '' },
    { items: [], name: 'příklady do dvaceti' },
    { items: [], name: 'příklady přes desítku a celé desítky do sta' },
  ],
};

/* ---------- Počty: příkladů je neomezeně, stupně se počítají podle počtu zvládnutých ---------- */
// Přechod přes desítku (8 + 7, 16 − 9) až po zvládnutí počítání do 20 bez přechodu (Ondřej 20. 10. 2026, jako ve škole).
export const MATH_TO_20 = 12;     // zvládnutých příkladů do 10, než přijdou příklady do 20
export const CROSSING_READY = 10; // zvládnutých příkladů v druhé desítce bez přechodu, než přijde přechod a desítky
export const CROSSING_SHARE = .3; // pak přechod jen u menšiny příkladů
export function isCrossing(a: number, op: string, b: number): boolean {
  if (op === '+') return a % 10 + b % 10 > 10;
  return a > 10 && a % 10 !== 0 && a % 10 < b % 10;
}
export const parseMath = (k: string) => { const m = /^(\d+)([+-])(\d+)$/.exec(k); return m ? { a: +m[1], op: m[2], b: +m[3] } : null; };
function goodMath(stats: Stats, ok: (p: { a: number; op: string; b: number; top: number }) => boolean): number {
  let n = 0;
  for (const [k, s] of Object.entries(stats)) {
    if (!k.startsWith('math:') || mastery(s) !== 'good') continue;
    const p = parseMath(k.slice(5)); if (!p) continue;
    if (ok({ ...p, top: Math.max(p.a, p.b, p.op === '+' ? p.a + p.b : p.a) })) n++;
  }
  return n;
}
// první stupeň: nejdřív do 6 jako v Adamově Matematice 1 (ALTER, „Numerace, sčítání a odčítání do 6“; Ondřej 24. 10. 2026),
// do 10 až po zvládnutí MATH_TO_10 příkladů do 6
export const MATH_TO_10 = 8;
export const MATH_7_10 = 5; // a do 20 až po zvládnutí aspoň 5 příkladů s čísly 7 až 10 (ať se do 10 nepřeskočí)
export const mathTop = (stats: Stats, stage: number): number => stage >= 1 ? 20 : goodMath(stats, p => p.top <= 6) >= MATH_TO_10 ? 10 : 6;
export const crossingReady = (stats: Stats): boolean => goodMath(stats, p => p.top > 10 && p.top <= 20 && !isCrossing(p.a, p.op, p.b)) >= CROSSING_READY;

/* ---------- výpočet stupně ---------- */
export const share = (stats: Stats, level: string, items: string[]): number =>
  items.length ? items.filter(it => mastery(stats[level + ':' + it]) === 'good').length / items.length : 0;
// stupeň jen podle zvládnutí (bez paměti)
export function masteredStage(level: string, stats: Stats): number {
  if (level === 'math') return crossingReady(stats) ? 2 : goodMath(stats, p => p.top <= 10) >= MATH_TO_20 && goodMath(stats, p => p.top > 6 && p.top <= 10) >= MATH_7_10 ? 1 : 0;
  const st = STAGES[level]; if (!st) return 0;
  let k = 0;
  while (k < st.length - 1 && share(stats, level, st[k].items) >= STAGE_SHARE) k++;
  return k;
}
// platný stupeň: zvládnutí, nebo dřív dosažený (nikdy se nezavře)
export function stageOf(level: string, stats: Stats, reached: Record<string, number> = {}): number {
  const last = (STAGES[level] || [{}]).length - 1;
  return Math.min(last, Math.max(reached[level] || 0, masteredStage(level, stats)));
}
// jen úlohy ze zapnutých písmen (rodič mohl vypnout třeba M); když ze stupně nic nezbude, celý zapnutý obsah
const LIVE: Record<string, () => string[]> = { letters: () => LETTERS, syllables: () => SYLL, words: () => WORDS, reading: () => PIC_WORDS, writing: () => WRITING_ALL };
export function stageItems(level: string, stage: number): string[] {
  const items = STAGES[level][stage].items, live = LIVE[level];
  if (!live) return items;
  const all = live(), ok = items.filter(it => all.includes(it));
  return ok.length ? ok : all;
}
// co se nově otevřelo mezi dvěma stupni (věta pro Adama), prázdné = nic
export function stageNews(level: string, from: number, to: number): string {
  const st = STAGES[level]; if (!st || to <= from) return '';
  return st.slice(from + 1, to + 1).map(s => s.name).filter(Boolean).join(' a ');
}
