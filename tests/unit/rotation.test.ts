// Střídání pater (Ondřej 20. 10. 2026)
import { describe, expect, it } from 'vitest';
import { restingLevel, suggestLevel } from '../../src/logic/rotation';

const F = ['letters', 'syllables', 'numbers', 'math'];
const r = (level: string, quit = false) => ({ level, quit });

describe('střídání pater', () => {
  it('po 3 kolech stejného patra za sebou patro odpočívá', () => {
    expect(restingLevel([r('numbers'), r('numbers')], F)).toBeNull();
    expect(restingLevel([r('numbers'), r('numbers'), r('numbers')], F)).toBe('numbers');
    expect(restingLevel([r('letters'), r('numbers'), r('numbers'), r('numbers')], F)).toBe('numbers');
  });
  it('kolo jiného patra (i procvičování) pauzu ukončí, odchody z kola se nepočítají', () => {
    expect(restingLevel([r('numbers'), r('numbers'), r('numbers'), r('letters')], F)).toBeNull();
    expect(restingLevel([r('numbers'), r('numbers'), r('numbers'), r('practice')], F)).toBeNull();
    expect(restingLevel([r('numbers'), r('numbers'), r('letters', true), r('numbers')], F)).toBe('numbers');
    expect(restingLevel([r('practice'), r('practice'), r('practice')], F)).toBeNull();
  });
  it('doporučí patro, které Adam nehrál nejdéle', () => {
    expect(suggestLevel([r('letters'), r('math'), r('numbers'), r('numbers'), r('numbers')], F, 'numbers')).toBe('syllables');
    expect(suggestLevel([r('syllables'), r('letters'), r('math'), r('numbers')], F, 'numbers')).toBe('syllables');
  });
});
