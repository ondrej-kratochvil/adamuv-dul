// Zvládnutí úkolů: kdy je písmeno, slovo nebo příklad „zvládnuté“ a kolik toho Adam zvládl celkem.
// Z počtu zvládnutých úkolů se počítají dlouhodobé odměny (očarování, vesnice, oči Enderu).
import { LETTERS, SYLL } from '../content/letters';
import { WORDS } from '../content/words';
import { PIC_WORDS } from '../content/pictures';
import { GLYPHS } from '../content/glyphs';
import { range } from './random';

export interface Stat { ok: number; miss: number; n?: number; bad?: number }
export type Stats = Record<string, Stat>;
export type Mastery = '' | 'good' | 'mid' | 'bad';

// zvládnuté = aspoň 3× správně a teď bez chyb; potíže = poslední dobou aspoň 2 chyby
export function mastery(s?: Stat): Mastery {
  if (!s || !(s.n || s.ok || s.miss)) return '';
  if (s.miss >= 2) return 'bad';
  if (s.ok >= 3 && s.miss === 0) return 'good';
  return 'mid';
}

// zápis výsledku úkolu: na první pokus = ok (a jedna stará chyba se odpustí), jinak chyba
export function recordResult(stats: Stats, key: string, firstTry: boolean): Stat {
  const s = stats[key] || { ok: 0, miss: 0 };
  if (firstTry) { s.ok++; s.miss = Math.max(0, s.miss - 1); } else { s.miss++; s.bad = (s.bad || 0) + 1; }
  s.n = (s.n || 0) + 1;
  stats[key] = s;
  return s;
}

// častěji přicházejí úkoly, se kterými má Adam potíže
export function weight(stats: Stats, level: string, it: string): number {
  const s = stats[level + ':' + it] || { ok: 0, miss: 0 };
  return Math.max(.5, Math.min(5, 1 + s.miss * 1.5 - s.ok * .25));
}

// počet kostek na výběr: 2, po 2 povedených kolech 3, po 5 kolech 4
export const choiceCount = (roundsInLevel: number): number => roundsInLevel < 2 ? 2 : roundsInLevel < 5 ? 3 : 4;

// Patra s konečným seznamem úkolů. U neomezených (příklady, čísla nad 20) se počítá jen omezený počet.
export const MATH_MAX = 30;      // nejvýš 30 různých zvládnutých příkladů
export const BIG_NUMBERS_MAX = 20; // nejvýš 20 zvládnutých čísel 21 až 99 mimo desítky
export const NUMBERS_BASE: string[] = [...range(0, 20), ...range(30, 100, 10)].map(String);
const isBigNumber = (k: string) => { const n = Number(k); return n > 20 && n < 100 && n % 10 !== 0; };

export const MASTERY_SETS = (): Record<string, string[]> => ({
  letters: LETTERS, syllables: SYLL, words: WORDS, reading: PIC_WORDS, writing: Object.keys(GLYPHS), numbers: NUMBERS_BASE,
});

const goodKeys = (stats: Stats, prefix: string) => Object.keys(stats).filter(k => k.startsWith(prefix) && mastery(stats[k]) === 'good').map(k => k.slice(prefix.length));

// pokrok jednoho patra: kolik zvládl a kolik je celkem
export function levelProgress(stats: Stats, lv: string): { got: number; all: number } {
  if (lv === 'math') return { got: Math.min(MATH_MAX, goodKeys(stats, 'math:').length), all: MATH_MAX };
  const items = MASTERY_SETS()[lv];
  let got = items.filter(it => mastery(stats[lv + ':' + it]) === 'good').length, all = items.length;
  if (lv === 'numbers') { got += Math.min(BIG_NUMBERS_MAX, goodKeys(stats, 'numbers:').filter(isBigNumber).length); all += BIG_NUMBERS_MAX; }
  return { got, all };
}

export const LEVEL_KEYS = ['letters', 'syllables', 'words', 'reading', 'numbers', 'math', 'writing'];

// celkový pokrok přes všechna patra
export function masteryPoints(stats: Stats): { pts: number; max: number } {
  let pts = 0, max = 0;
  for (const lv of LEVEL_KEYS) { const p = levelProgress(stats, lv); pts += p.got; max += p.all; }
  return { pts, max };
}
