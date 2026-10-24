// Generátory úkolů: tisíce náhodných úkolů v každé fázi obtížnosti.
import { describe, expect, it } from 'vitest';
import { conflict, genLetters, genMath, genNumbers, genReading, genWords, genWriting, WRITING_EASY, WRITING_HARD, crossingReady, isCrossing, type Ctx, type Task } from '../../src/logic/tasks';
import { STAGES } from '../../src/logic/stages';
import { choiceCount } from '../../src/logic/mastery';
import type { Stats } from '../../src/logic/mastery';
import { seeded } from '../../src/logic/random';
import { GLYPHS } from '../../src/content/glyphs';

// stupeň obtížnosti (logic/stages.ts) se dává rovnou, kola řídí jen počet kostek
const ROUNDS = [0, 2, 9];
const ctxFor = (level: string, rounds: number, seed: number, stage = 0): Ctx => ({ rounds: { [level]: rounds }, stats: {}, recent: [], rng: seeded(seed), stages: { [level]: stage } });
const stagesOf = (level: string) => STAGES[level].map((_, i) => i);

function checkTask(t: Task, n: number) {
  expect(t.choices).toContain(t.answer);
  expect(new Set(t.choices).size).toBe(t.choices.length);
  expect(t.choices.length).toBe(n);
  expect(t.say.length).toBeGreaterThan(0);
}

describe.each(['letters', 'syllables'])('patro %s', level => {
  it.each(stagesOf(level))('stupeň %i: správná odpověď vždy mezi kostkami, nic znějícího stejně, jen otevřené úlohy', st => {
    const open = STAGES[level][st].items;
    for (const r of ROUNDS) for (let s = 1; s <= 200; s++) {
      const t = genLetters(level, ctxFor(level, r, s, st));
      checkTask(t, choiceCount(r));
      for (const c of t.choices) expect(open, c).toContain(c);
      for (const a of t.choices) for (const b of t.choices) if (a !== b) expect(conflict(level, a, b)).toBe(false);
    }
  });
});

describe('čísla', () => {
  it.each(stagesOf('numbers'))('stupeň %i: do 10, 20, 50, 100', st => {
    const max = [10, 20, 50, 100][st];
    for (const r of ROUNDS) for (let s = 1; s <= 200; s++) {
      const t = genNumbers(ctxFor('numbers', r, s, st));
      checkTask(t, choiceCount(r));
      for (const c of t.choices) { const n = Number(c); expect(Number.isInteger(n) && n >= 0 && n <= max).toBe(true); }
    }
  });
});

describe('počty', () => {
  it.each(stagesOf('math'))('stupeň %i: výsledek sedí a není záporný, do 10, do 20, pak i desítky', st => {
    for (const r of ROUNDS) for (let s = 1; s <= 200; s++) {
      const t = genMath(ctxFor('math', r, s, st));
      checkTask(t, choiceCount(r));
      const [, a, op, b] = t.task!.match(/^(\d+) ([+−]) (\d+) = \?$/)!;
      expect(Number(t.answer)).toBe(op === '+' ? +a + +b : +a - +b);
      for (const c of t.choices) expect(Number(c)).toBeGreaterThanOrEqual(0);
      if (st < 2) expect(Math.max(+a, +b, Number(t.answer))).toBeLessThanOrEqual(st < 1 ? 10 : 20);
    }
  });
});

describe('slova a čtení', () => {
  it.each(stagesOf('words'))('slova, stupeň %i: délka slova podle stupně', st => {
    const maxLen = [3, 4, 9][st];
    for (const r of ROUNDS) for (let s = 1; s <= 200; s++) { const t = genWords(ctxFor('words', r, s, st)); checkTask(t, choiceCount(r)); expect(t.answer.length).toBeLessThanOrEqual(maxLen); }
  });
  it.each(stagesOf('reading'))('čtení, stupeň %i: množné číslo až ve druhém stupni', st => {
    for (const r of ROUNDS) for (let s = 1; s <= 200; s++) {
      const t = genReading(ctxFor('reading', r, s, st));
      checkTask(t, choiceCount(r));
      if (st < 1) for (const c of t.choices) expect(['OSY', 'ÚLY', 'LAMY', 'MÍSY']).not.toContain(c);
    }
  });
  it('nedávné úkoly se neopakují', () => {
    for (let s = 1; s <= 200; s++) expect(genWords({ rounds: { words: 9 }, stats: {}, recent: ['LES', 'LOS', 'OSA', 'SŮL'], rng: seeded(s), stages: { words: 2 } }).answer).not.toMatch(/^(LES|LOS|OSA|SŮL)$/);
  });
});

describe('psaní', () => {
  it('na začátku jen snadné tahy, smyčka a spirála až později (review 19. 10. 2026)', () => {
    const seen = new Set<string>();
    for (let s = 1; s <= 500; s++) seen.add(genWriting({ rounds: { writing: 0 }, stats: { 'writing:vlnka': { ok: 0, miss: 9 } }, recent: [], rng: seeded(s) }));
    expect([...seen].every(x => WRITING_EASY.includes(x))).toBe(true);
    expect(seen.has('spirala')).toBe(false);
  });
  it('smyčka a spirála až v posledním stupni (smyčka Adamovi nešla, 20. 10. 2026)', () => {
    for (const h of WRITING_HARD) { expect(STAGES.writing[0].items).not.toContain(h); expect(STAGES.writing[1].items).not.toContain(h); expect(STAGES.writing[2].items).toContain(h); }
    expect(STAGES.writing[1].items).toContain('A');
  });
  it('každý úkol psaní má tahy', () => {
    for (let s = 1; s <= 500; s++) expect(GLYPHS[genWriting(ctxFor('writing', 9, s, 2))]?.length).toBeGreaterThan(0);
  });
  it('cvik s chybami se vrací nanejvýš dvakrát častěji', () => {
    let spir = 0; const N = 4000;
    for (let s = 1; s <= N; s++) if (genWriting({ rounds: { writing: 9 }, stats: { 'writing:spirala': { ok: 0, miss: 20 } }, recent: [], rng: seeded(s), stages: { writing: 2 } }) === 'spirala') spir++;
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
      const t = genMath({ rounds: { math: 5 }, stats: {}, recent: [], rng: seeded(s), stages: { math: 1 } });
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

describe('chytáky v Číslech (Ondřej 20. 10. 2026)', () => {
  it('u dvojciferných skoro vždy prohozené číslice', () => {
    let rev = 0; const N = 400;
    for (let s = 1; s <= N; s++) { const t = genNumbers({ rounds: { numbers: 9 }, stats: {}, recent: [], rng: seeded(s), force: '68' }); if (t.choices.includes('86')) rev++; expect(t.choices).toContain('68'); }
    expect(rev / N).toBeGreaterThan(.75);
  });
  it('jednociferná čísla bez nesmyslných chytáků', () => {
    for (let s = 1; s <= 100; s++) { const t = genNumbers({ rounds: { numbers: 9 }, stats: {}, recent: [], rng: seeded(s), force: '7' }); expect(new Set(t.choices).size).toBe(t.choices.length); }
  });
});

