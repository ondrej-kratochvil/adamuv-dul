import { describe, expect, it } from 'vitest';
import { FAMILY_LINES, MOM_SLOTS } from '../../src/content/family-lines';
import { earlyBird, helloFor, momReminder, pickLine, remember, NO_REPEAT } from '../../src/logic/family';
import { seeded } from '../../src/logic/random';
import { ADAM } from '../../src/content/player-adam';
const MOM = ADAM.mom!;

const at = (iso: string) => new Date(iso);

describe('hlášky rodiny', () => {
  it('každý má vlastní pochvaly, povzbuzení a pozdrav', () => {
    for (const id of ['paja', 'ondra', 'jindra', 'bob', 'iva', 'marek', 'david', 'vita', 'vasek', 'terka', 'ruda', 'sarka', 'tomas', 'marcelka']) {
      const l = FAMILY_LINES[id];
      expect(l.cheers.length, id).toBeGreaterThanOrEqual(6);
      expect(l.enc.length, id).toBeGreaterThanOrEqual(2);
      expect(l.hello.length, id).toBeGreaterThan(5);
    }
  });
  it('noví příbuzní (own) říkají jen své věty, i když se opakují', () => {
    const own = FAMILY_LINES.vita.cheers;
    let recent: string[] = []; const rng = seeded(5);
    for (let i = 0; i < 40; i++) { const l = pickLine(own, [], recent, rng); expect(own).toContain(l); recent = remember(recent, l); }
  });
  it('vlastní věty asi z 90 %, nedávné se neopakují', () => {
    const own = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], common = ['x', 'y', 'z'];
    let ownCount = 0, recent: string[] = [];
    const rng = seeded(3);
    for (let i = 0; i < 2000; i++) {
      const l = pickLine(own, common, recent, rng);
      expect(recent).not.toContain(l);
      if (own.includes(l)) ownCount++;
      recent = remember(recent, l);
      expect(recent.length).toBeLessThanOrEqual(NO_REPEAT);
    }
    expect(ownCount / 2000).toBeGreaterThan(.8);
    expect(ownCount / 2000).toBeLessThan(.97);
  });
  it('když jsou všechny věty nedávné, stejně nějakou vybere', () => {
    expect(['a']).toContain(pickLine(['a'], [], ['a']));
  });
});

describe('máma se stará', () => {
  it('ve všední den ráno do školy, o víkendu snídaně', () => {
    expect(momReminder(at('2026-10-20T07:10:00'), 0, [], MOM)?.text).toContain('do školy'); // úterý
    expect(momReminder(at('2026-10-24T07:10:00'), 0, [], MOM)?.text).toContain('nasnídat');  // sobota
  });
  it('oběd, večeře, spaní', () => {
    expect(momReminder(at('2026-10-20T12:00:00'), 0, [], MOM)?.id).toBe('obed');
    expect(momReminder(at('2026-10-20T18:00:00'), 0, [], MOM)?.id).toBe('vecere');
    expect(momReminder(at('2026-10-20T20:15:00'), 0, [], MOM)?.id).toBe('spat');
  });
  it('text připomínky nezačíná pochvalou (dá se před něj pochvala i povzbuzení)', () => {
    for (const s of MOM_SLOTS) expect(s.text, s.id).not.toMatch(/^(Výborně|Šikula|Paráda)/);
  });
  it('každá připomínka jednou za den', () => {
    expect(momReminder(at('2026-10-20T20:15:00'), 0, ['spat'], MOM)).toBeNull();
  });
  it('po 30 minutách hraní za den', () => {
    expect(momReminder(at('2026-10-20T15:00:00'), 29 * 60, [], MOM)).toBeNull();
    expect(momReminder(at('2026-10-20T15:00:00'), 30 * 60, [], MOM)?.id).toBe('dlouho');
    expect(momReminder(at('2026-10-20T15:00:00'), 99 * 60, ['dlouho'], MOM)).toBeNull();
  });
});

describe('prababička Marcelka vstává brzo (Ondřej 20. 10. 2026)', () => {
  it('ranní ptáče jen před 7:30 a jednou za den', () => {
    expect(earlyBird(at('2026-10-20T06:45:00'), [], '07:30')).toBe(true);
    expect(earlyBird(at('2026-10-20T07:29:00'), [], '07:30')).toBe(true);
    expect(earlyBird(at('2026-10-20T07:30:00'), [], '07:30')).toBe(false);
    expect(earlyBird(at('2026-10-20T06:45:00'), ['ranni'], '07:30')).toBe(false);
  });
  it('ráno do 9:00 ranní pozdrav, jindy běžný; kdo ranní nemá, má běžný', () => {
    expect(helloFor(FAMILY_LINES.marcelka, at('2026-10-20T08:59:00'))).toContain('Dobré ráno');
    expect(helloFor(FAMILY_LINES.marcelka, at('2026-10-20T09:00:00'))).toContain('z Ostravy');
    expect(helloFor(FAMILY_LINES.iva, at('2026-10-20T07:00:00'))).toBe(FAMILY_LINES.iva.hello);
  });
});

