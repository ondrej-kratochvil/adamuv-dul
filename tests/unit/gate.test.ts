import { describe, expect, it } from 'vitest';
import { gateOk, makeGate } from '../../src/logic/gate';
import { seeded } from '../../src/logic/random';

describe('zámek nastavení', () => {
  it('příklad je násobení s výsledkem 72 až 171', () => {
    for (let s = 1; s <= 500; s++) {
      const g = makeGate(seeded(s));
      expect(g.answer).toBe(g.a * g.b);
      expect(g.answer).toBeGreaterThanOrEqual(72);
      expect(g.answer).toBeLessThanOrEqual(171);
      expect(g.text).toBe(`${g.a} × ${g.b}`);
    }
  });
  it('kontrola odpovědi', () => {
    const g = { a: 14, b: 7, answer: 98, text: '14 × 7' };
    expect(gateOk(g, '98')).toBe(true);
    expect(gateOk(g, ' 98 ')).toBe(true);
    expect(gateOk(g, '97')).toBe(false);
    expect(gateOk(g, '')).toBe(false);
  });
});
