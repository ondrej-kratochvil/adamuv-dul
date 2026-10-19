import { describe, expect, it } from 'vitest';
import { RISKY_SYLLABLES, pronounce, pronounceAs } from '../../src/logic/pronounce';
import { genLetters, genWords } from '../../src/logic/tasks';
import { SYLL } from '../../src/content/letters';
import { seeded } from '../../src/logic/random';

describe('výslovnost', () => {
  it('rizikové slabiky jsou ve hře a v základu říkají i písmena', () => {
    for (const s of RISKY_SYLLABLES) expect(SYLL).toContain(s);
    expect(pronounce('SO')).toBe('so, es, o');
    expect(pronounce('MY')).toBe('my, em, ypsilon');
  });
  it('slabiky s čárkou a běžné slabiky jen obyčejně', () => {
    expect(pronounce('MÁ')).toBe('má');
    expect(pronounce('LA')).toBe('la');
  });
  it('volba rodiče má přednost', () => {
    expect(pronounce('SO', { SO: 'plain' })).toBe('so');
    expect(pronounce('SO', { SO: 'split' })).toBe('s­o');
    expect(pronounce('SO', { SO: 'nesmysl' })).toBe('so, es, o');
  });
  it('rozděleně: stejná písmena, jen neviditelné dělítko', () => {
    expect(pronounceAs('SUM', 'split').replace(/­/g, '')).toBe('sum');
  });
  it('v úkolech už není „Slabika“ ani „Slovo“', () => {
    for (let s = 1; s <= 200; s++) {
      expect(genLetters('syllables', { rounds: {}, stats: {}, recent: [], rng: seeded(s) }).say).not.toMatch(/Slabika/);
      expect(genWords({ rounds: { words: 9 }, stats: {}, recent: [], rng: seeded(s) }).say).not.toMatch(/Slovo/);
    }
  });
});
