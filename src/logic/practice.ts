// Procvičování: kolo složené z úloh, které Adamovi nejdou (chyby, záměny, dlouhé přemýšlení). Zavedeno 20. 10. 2026.
// Psaní se neprocvičuje tady (jiný druh úkolu: jízda prstem), jen patra s kostkami.
import { avgSecs, mastery, type Stats } from './mastery';
import { weightedPick, type Rng } from './random';
import { crossingReady, isCrossing } from './tasks';

export const PRACTICE_LEVELS = ['letters', 'syllables', 'words', 'reading', 'numbers', 'math'];
export const PRACTICE_MIN = 3;  // procvičit jde, až je aspoň tolik slabých úloh
export const SLOW_FACTOR = 1.6; // „pomalé“ = průměr aspoň 1,6× delší než obvyklá doba v patře

export interface WeakItem { level: string; item: string; score: number; why: string[] }
export interface Confusion { item: string; with: string; count: number }

const split = (k: string): [string, string] => { const i = k.indexOf(':'); return [k.slice(0, i), k.slice(i + 1)]; };
const median = (a: number[]): number => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };

// obvyklá doba řešení v patře (medián průměrů úloh změřených aspoň dvakrát)
export function levelMedianSecs(stats: Stats, level: string): number {
  return median(Object.entries(stats).filter(([k, s]) => split(k)[0] === level && (s.tn || 0) >= 2).map(([, s]) => avgSecs(s)!));
}

// úlohy, nad kterými Adam přemýšlí nejdéle (aspoň 2 měření)
export function slowItems(stats: Stats, level: string, n = 5): { item: string; secs: number }[] {
  return Object.entries(stats).filter(([k, s]) => split(k)[0] === level && (s.tn || 0) >= 2)
    .map(([k, s]) => ({ item: split(k)[1], secs: avgSecs(s)! })).sort((a, b) => b.secs - a.secs).slice(0, n);
}

// co si s čím plete (nejčastější záměny v patře)
export function confusions(stats: Stats, level: string, n = 5): Confusion[] {
  const out: Confusion[] = [];
  for (const [k, s] of Object.entries(stats)) { const [lv, it] = split(k); if (lv !== level || !s.conf) continue; for (const [w, c] of Object.entries(s.conf)) out.push({ item: it, with: w, count: c }); }
  return out.sort((a, b) => b.count - a.count).slice(0, n);
}

// podíl chyb, které byly rychlým tipem
export function quickWrongShare(stats: Stats, level: string): number | null {
  let bad = 0, qw = 0;
  for (const [k, s] of Object.entries(stats)) if (split(k)[0] === level) { bad += s.bad || 0; qw += s.qw || 0; }
  return bad ? Math.min(1, qw / bad) : null;
}

// slabé úlohy napříč patry, nejslabší první
export function weakItems(stats: Stats): WeakItem[] {
  const med: Record<string, number> = {};
  for (const lv of PRACTICE_LEVELS) med[lv] = levelMedianSecs(stats, lv);
  const out: WeakItem[] = [], cross = crossingReady(stats);
  for (const [k, s] of Object.entries(stats)) {
    const [level, item] = split(k);
    if (!PRACTICE_LEVELS.includes(level)) continue;
    // přechod přes desítku se neprocvičuje, dokud ho hra ještě nedává
    if (level === 'math' && !cross) { const m = /^(\d+)([+-])(\d+)$/.exec(item); if (m && isCrossing(+m[1], m[2], +m[3])) continue; }
    let score = 0; const why: string[] = [];
    if (s.miss > 0) { score += s.miss * 2; why.push('chyby'); }
    const top = s.conf ? Object.entries(s.conf).sort((a, b) => b[1] - a[1])[0] : null;
    if (top && top[1] >= 2 && mastery(s) !== 'good') { score += 1; why.push('plete si s ' + top[0]); }
    const a = avgSecs(s);
    if (a !== null && (s.tn || 0) >= 2 && med[level] > 0 && a >= med[level] * SLOW_FACTOR) { score += 1.5; why.push('dlouho přemýšlí'); }
    if (score > 0) out.push({ level, item, score, why });
  }
  return out.sort((a, b) => b.score - a.score);
}

// další úloha do procvičování: slabší častěji, ale pestře (Ondřej 20. 10. 2026: pořád mísa a písmeno E):
// stejná úloha nejvýš 2× za kolo a nikdy dvakrát po sobě, čím častěji už byla, tím menší šance; null = nic dalšího
export const PRACTICE_REPEAT_MAX = 2;
export function pickPractice(weak: WeakItem[], recent: string[], rng: Rng = Math.random): WeakItem | null {
  const used = (w: WeakItem) => recent.filter(r => r === w.level + ':' + w.item).length;
  const last = recent[recent.length - 1];
  const pool = weak.filter(w => used(w) < PRACTICE_REPEAT_MAX && w.level + ':' + w.item !== last);
  if (!pool.length) return null;
  return weightedPick(pool, w => w.score / (1 + 2 * used(w)), rng);
}
// k slabým úlohám přidá ty, které se Adam teprve učí (aspoň jednou zkoušené, ještě nezvládnuté), ať je z čeho střídat
export function practicePool(stats: Stats, min = 8): WeakItem[] {
  const weak = weakItems(stats);
  if (weak.length >= min) return weak;
  const have = new Set(weak.map(w => w.level + ':' + w.item));
  const extra: WeakItem[] = [];
  for (const [k, s] of Object.entries(stats)) {
    const [level, item] = split(k);
    if (!PRACTICE_LEVELS.includes(level) || have.has(k) || mastery(s) !== 'mid') continue;
    if (level === 'math') { const m = /^(\d+)([+-])(\d+)$/.exec(item); if (m && isCrossing(+m[1], m[2], +m[3]) && !crossingReady(stats)) continue; }
    extra.push({ level, item, score: .6, why: ['učí se'] });
  }
  return [...weak, ...extra];
}
