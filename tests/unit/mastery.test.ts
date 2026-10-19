import { describe, expect, it } from 'vitest';
import { BIG_NUMBERS_MAX, MATH_MAX, MASTERY_SETS, choiceCount, levelProgress, mastery, masteryPoints, recordResult, weight, type Stats } from '../../src/logic/mastery';

const good = { ok: 3, miss: 0, n: 3 };

describe('zvládnutí', () => {
  it('stavy štítků', () => {
    expect(mastery(undefined)).toBe('');
    expect(mastery({ ok: 3, miss: 0 })).toBe('good');
    expect(mastery({ ok: 2, miss: 0 })).toBe('mid');
    expect(mastery({ ok: 9, miss: 2 })).toBe('bad');
  });
  it('správně na první pokus odpustí jednu starou chybu', () => {
    const s: Stats = { 'letters:A': { ok: 2, miss: 1 } };
    recordResult(s, 'letters:A', true);
    expect(s['letters:A']).toMatchObject({ ok: 3, miss: 0, n: 1 });
    recordResult(s, 'letters:A', false);
    expect(s['letters:A']).toMatchObject({ miss: 1, bad: 1, n: 2 });
  });
  it('váha úkolu je mezi 0,5 a 5', () => {
    expect(weight({ 'x:a': { ok: 100, miss: 0 } }, 'x', 'a')).toBe(.5);
    expect(weight({ 'x:a': { ok: 0, miss: 100 } }, 'x', 'a')).toBe(5);
    expect(weight({}, 'x', 'a')).toBe(1);
  });
  it('počet kostek 2, 3, 4', () => {
    expect([0, 1, 2, 4, 5, 20].map(choiceCount)).toEqual([2, 2, 3, 3, 4, 4]);
  });
  it('příklady se počítají nejvýš do 30', () => {
    const s: Stats = {};
    for (let i = 0; i < 40; i++) s[`math:${i}+1`] = good;
    expect(levelProgress(s, 'math')).toEqual({ got: MATH_MAX, all: MATH_MAX });
  });
  it('čísla nad 20 se počítají (review 19. 10. 2026), nejvýš 20 navíc', () => {
    const s: Stats = {};
    for (let n = 21; n < 100; n++) if (n % 10) s['numbers:' + n] = good;
    expect(levelProgress(s, 'numbers').got).toBe(BIG_NUMBERS_MAX);
    s['numbers:47'] = { ok: 1, miss: 0 };
    expect(levelProgress({ 'numbers:47': good }, 'numbers').got).toBe(1);
  });
  it('vše zvládnuté = plný počet bodů', () => {
    const s: Stats = {};
    for (const [lv, items] of Object.entries(MASTERY_SETS())) for (const it of items) s[`${lv}:${it}`] = good;
    for (let i = 0; i < MATH_MAX; i++) s[`math:${i}+0`] = good;
    for (let n = 21; n <= 40; n++) if (n % 10) s['numbers:' + n] = good;
    for (let n = 41; n <= 45; n++) s['numbers:' + n] = good;
    const { pts, max } = masteryPoints(s);
    expect(pts).toBe(max);
  });
});
