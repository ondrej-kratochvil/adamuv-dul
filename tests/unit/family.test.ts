import { describe, expect, it } from 'vitest';
import { FAMILY_LINES, MOM_SLOTS } from '../../src/content/family-lines';
import { momReminder, pickLine, remember, NO_REPEAT } from '../../src/logic/family';
import { seeded } from '../../src/logic/random';

const at = (iso: string) => new Date(iso);

describe('hlášky rodiny', () => {
  it('každý má vlastní pochvaly, povzbuzení a pozdrav', () => {
    for (const id of ['paja', 'ondra', 'jindra', 'bob', 'iva', 'marek', 'david']) {
      const l = FAMILY_LINES[id];
      expect(l.cheers.length, id).toBeGreaterThanOrEqual(6);
      expect(l.enc.length, id).toBeGreaterThanOrEqual(2);
      expect(l.hello.length, id).toBeGreaterThan(5);
    }
  });
  it('vlastní věty asi ze 70 %, nedávné se neopakují', () => {
    const own = ['a', 'b', 'c', 'd', 'e', 'f', 'g'], common = ['x', 'y', 'z'];
    let ownCount = 0, recent: string[] = [];
    const rng = seeded(3);
    for (let i = 0; i < 2000; i++) {
      const l = pickLine(own, common, recent, rng);
      expect(recent).not.toContain(l);
      if (own.includes(l)) ownCount++;
      recent = remember(recent, l);
      expect(recent.length).toBeLessThanOrEqual(NO_REPEAT);
    }
    expect(ownCount / 2000).toBeGreaterThan(.6);
    expect(ownCount / 2000).toBeLessThan(.8);
  });
  it('když jsou všechny věty nedávné, stejně nějakou vybere', () => {
    expect(['a']).toContain(pickLine(['a'], [], ['a']));
  });
});

describe('máma se stará', () => {
  it('ve všední den ráno do školy, o víkendu snídaně', () => {
    expect(momReminder(at('2026-10-20T07:10:00'), 0, [])?.text).toContain('do školy'); // úterý
    expect(momReminder(at('2026-10-24T07:10:00'), 0, [])?.text).toContain('nasnídat');  // sobota
  });
  it('oběd, večeře, spaní', () => {
    expect(momReminder(at('2026-10-20T12:00:00'), 0, [])?.id).toBe('obed');
    expect(momReminder(at('2026-10-20T18:00:00'), 0, [])?.id).toBe('vecere');
    expect(momReminder(at('2026-10-20T20:15:00'), 0, [])?.id).toBe('spat');
  });
  it('text připomínky nezačíná pochvalou (dá se před něj pochvala i povzbuzení)', () => {
    for (const s of MOM_SLOTS) expect(s.text, s.id).not.toMatch(/^(Výborně|Šikula|Paráda)/);
  });
  it('každá připomínka jednou za den', () => {
    expect(momReminder(at('2026-10-20T20:15:00'), 0, ['spat'])).toBeNull();
  });
  it('po 30 minutách hraní za den', () => {
    expect(momReminder(at('2026-10-20T15:00:00'), 29 * 60, [])).toBeNull();
    expect(momReminder(at('2026-10-20T15:00:00'), 30 * 60, [])?.id).toBe('dlouho');
    expect(momReminder(at('2026-10-20T15:00:00'), 99 * 60, ['dlouho'])).toBeNull();
  });
});
