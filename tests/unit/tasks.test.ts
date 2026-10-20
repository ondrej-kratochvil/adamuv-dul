// Generátory úkolů: tisíce náhodných úkolů v každé fázi obtížnosti.
import { describe, expect, it } from 'vitest';
import { conflict, genLetters, genMath, genNumbers, genReading, genWords, genWriting, WRITING_EASY, WRITING_HARD, WRITING_HARD_FROM, writingPool, crossingReady, isCrossing, type Ctx, type Task } from '../../src/logic/tasks';
import { choiceCount } from '../../src/logic/mastery';
import type { Stats } from '../../src/logic/mastery';
import { seeded } from '../../src/logic/random';
import { GLYPHS } from '../../src/content/glyphs';

const STAGES = [0, 2, 4, 6, 9];
const ctxFor = (level: string, rounds: number, seed: number): Ctx => ({ rounds: { [level]: rounds }, stats: {}, recent: [], rng: seeded(seed) });

function checkTask(t: Task, n: number) {
  expect(t.choices).toContain(t.answer);
  expect(new Set(t.choices).size).toBe(t.choices.length);
  expect(t.choices.length).toBe(n);
  expect(t.say.length).toBeGreaterThan(0);
}

describe.each(['letters', 'syllables'])('patro %s', level => {
  it.each(STAGES)('kolo %i: správná odpověď vždy mezi kostkami, nic znějícího stejně', r => {
    for (let s = 1; s <= 400; s++) {
      const t = genLetters(level, ctxFor(level, r, s));
      checkTask(t, choiceCount(r));
      for (const a of t.choices) for (const b of t.choices) if (a !== b) expect(conflict(level, a, b)).toBe(false);
    }
  });
});

describe('čísla', () => {
  it.each(STAGES)('kolo %i', r => {
    const max = r < 3 ? 10 : r < 7 ? 20 : 100;
    for (let s = 1; s <= 400; s++) {
      const t = genNumbers(ctxFor('numbers', r, s));
      checkTask(t, choiceCount(r));
      for (const c of t.choices) { const n = Number(c); expect(Number.isInteger(n) && n >= 0 && n <= max).toBe(true); }
    }
  });
});

describe('počty', () => {
  it.each(STAGES)('kolo %i: výsledek sedí a není záporný', r => {
    for (let s = 1; s <= 400; s++) {
      const t = genMath(ctxFor('math', r, s));
      checkTask(t, choiceCount(r));
      const [, a, op, b] = t.task!.match(/^(\d+) ([+−]) (\d+) = \?$/)!;
      expect(Number(t.answer)).toBe(op === '+' ? +a + +b : +a - +b);
      for (const c of t.choices) expect(Number(c)).toBeGreaterThanOrEqual(0);
      if (r < 7) expect(Math.max(+a, +b, Number(t.answer))).toBeLessThanOrEqual(r < 3 ? 10 : 20);
    }
  });
});

describe('slova a čtení', () => {
  it.each(STAGES)('slova, kolo %i: délka slova podle obtížnosti', r => {
    const maxLen = r < 3 ? 3 : r < 6 ? 4 : 9;
    for (let s = 1; s <= 300; s++) { const t = genWords(ctxFor('words', r, s)); checkTask(t, choiceCount(r)); expect(t.answer.length).toBeLessThanOrEqual(maxLen); }
  });
  it.each(STAGES)('čtení, kolo %i: množné číslo až od 3. kola', r => {
    for (let s = 1; s <= 300; s++) {
      const t = genReading(ctxFor('reading', r, s));
      checkTask(t, choiceCount(r));
      if (r < 3) for (const c of t.choices) expect(['OSY', 'ÚLY', 'LAMY', 'MÍSY']).not.toContain(c);
    }
  });
  it('nedávné úkoly se neopakují', () => {
    for (let s = 1; s <= 200; s++) expect(genWords({ rounds: { words: 9 }, stats: {}, recent: ['LES', 'LOS', 'OSA', 'SŮL'], rng: seeded(s) }).answer).not.toMatch(/^(LES|LOS|OSA|SŮL)$/);
  });
});

describe('psaní', () => {
  it('na začátku jen snadné tahy, smyčka a spirála až později (review 19. 10. 2026)', () => {
    const seen = new Set<string>();
    for (let s = 1; s <= 500; s++) seen.add(genWriting({ rounds: { writing: 0 }, stats: { 'writing:vlnka': { ok: 0, miss: 9 } }, recent: [], rng: seeded(s) }));
    expect([...seen].every(x => WRITING_EASY.includes(x))).toBe(true);
    expect(seen.has('spirala')).toBe(false);
  });
  it('smyčka a spirála až od 8. povedeného kola (smyčka Adamovi nešla, 20. 10. 2026)', () => {
    for (let r = 0; r < WRITING_HARD_FROM; r++) for (const h of WRITING_HARD) expect(writingPool(r)).not.toContain(h);
    for (const h of WRITING_HARD) expect(writingPool(WRITING_HARD_FROM)).toContain(h);
    expect(writingPool(3)).toContain('A');
  });
  it('každý úkol psaní má tahy', () => {
    for (let s = 1; s <= 500; s++) expect(GLYPHS[genWriting(ctxFor('writing', 9, s))]?.length).toBeGreaterThan(0);
  });
  it('cvik s chybami se vrací nanejvýš dvakrát častěji', () => {
    let spir = 0; const N = 4000;
    for (let s = 1; s <= N; s++) if (genWriting({ rounds: { writing: 9 }, stats: { 'writing:spirala': { ok: 0, miss: 20 } }, recent: [], rng: seeded(s) }) === 'spirala') spir++;
    expect(spir / N).toBeLessThan(0.1); // 28 úkolů, dvojnásobná váha ≈ 7 %
  });
});

describe('přechod přes desítku (Ondřej 20. 10. 2026)', () => {
  it('pozná příklady s přechodem', () => {
    for (const [a, op, b] of [[8, '+', 7], [9, '+', 2], [16, '-', 9], [13, '-', 6]] as const) expect(isCrossing(a, op, b), `${a}${op}${b}`).toBe(true);
    for (const [a, op, b] of [[6, '+', 4], [13, '+', 4], [13, '+', 7], [17, '-', 5], [10, '-', 3], [20, '-', 3], [15, '-', 10]] as const) expect(isCrossing(a, op, b), `${a}${op}${b}`).toBe(false);
  });
  it('do 20 bez přechodu, dokud Adam nezvládne 10 příkladů v druhé desítce', () => {
    for (let s = 1; s <= 600; s++) {
      const t = genMath({ rounds: { math: 5 }, stats: {}, recent: [], rng: seeded(s) });
      const m = /^(\d+)([+-])(\d+)$/.exec(t.stat.slice(5))!;
      expect(isCrossing(+m[1], m[2], +m[3]), t.stat).toBe(false);
    }
  });
  it('potom přechod jen u menšiny příkladů', () => {
    const stats: Stats = {};
    ['11+2', '12+3', '13+4', '14+5', '15+1', '16+2', '17-3', '18-4', '19-5', '15-2'].forEach(k => { stats['math:' + k] = { ok: 3, miss: 0, n: 3 }; });
    expect(crossingReady(stats)).toBe(true);
    let cross = 0; const N = 2000;
    for (let s = 1; s <= N; s++) { const t = genMath({ rounds: { math: 5 }, stats, recent: [], rng: seeded(s) }); const m = /^(\d+)([+-])(\d+)$/.exec(t.stat.slice(5))!; if (isCrossing(+m[1], m[2], +m[3])) cross++; }
    expect(cross / N).toBeGreaterThan(.2);
    expect(cross / N).toBeLessThan(.4);
  });
});
