import { describe, expect, it } from 'vitest';
import { dateSay, dateShow, greeting, isNewDay, nameDay, ordinalGen, pickQuest, questLevel, questStep, questText, stateHoliday } from '../../src/logic/daily';
import { NAMEDAYS } from '../../src/content/namedays';
import { seeded } from '../../src/logic/random';

const d = (s: string) => new Date(s + 'T08:00:00');

describe('datum slovy', () => {
  it('řadové číslovky v 2. pádě', () => {
    expect(ordinalGen(1)).toBe('prvního');
    expect(ordinalGen(20)).toBe('dvacátého');
    expect(ordinalGen(22)).toBe('dvacátého druhého');
    expect(ordinalGen(30)).toBe('třicátého');
    expect(ordinalGen(31)).toBe('třicátého prvního');
  });
  it('den a datum bez roku', () => {
    expect(dateShow(d('2026-10-22'))).toBe('čtvrtek 22. října');
    expect(dateSay(d('2026-10-22'))).toBe('čtvrtek dvacátého druhého října');
  });
  it('pozdrav podle hodiny', () => {
    expect(greeting(new Date('2026-10-22T07:00:00'))).toBe('Dobré ráno');
    expect(greeting(new Date('2026-10-22T14:00:00'))).toBe('Ahoj');
    expect(greeting(new Date('2026-10-22T19:00:00'))).toBe('Dobrý večer');
  });
});

describe('svátky', () => {
  it('kalendář jmen má každý den kromě státních svátků bez jména', () => {
    expect(Object.keys(NAMEDAYS).length).toBe(361);
    for (const md of ['01-01', '05-01', '05-08', '07-06', '12-25']) expect(NAMEDAYS[md]).toBeUndefined();
  });
  it('jedno, dvě i tři jména', () => {
    expect(nameDay(d('2026-10-22'))).toBe('Sabina');
    expect(nameDay(d('2026-12-24'))).toBe('Adam a Eva');
    expect(nameDay(d('2027-01-06'))).toBe('Kašpar, Melichar a Baltazar');
    expect(nameDay(d('2028-02-29'))).toBe('Horymír');
    expect(nameDay(d('2027-01-01'))).toBeNull();
  });
  it('státní svátky včetně Velikonoc', () => {
    expect(stateHoliday(d('2026-10-28'))).toBe('Den vzniku Československa');
    expect(stateHoliday(d('2027-03-26'))).toBe('Velký pátek'); // Velikonoční neděle 2027 = 28. 3.
    expect(stateHoliday(d('2027-03-29'))).toBe('Velikonoční pondělí');
    expect(stateHoliday(d('2026-10-22'))).toBeNull();
  });
});

describe('dnešní úkol', () => {
  it('nový den se pozná podle data', () => {
    expect(isNewDay(null, d('2026-10-22'))).toBe(true);
    expect(isNewDay({ d: '2026-10-22', quest: null }, d('2026-10-22'))).toBe(false);
    expect(isNewDay({ d: '2026-10-21', quest: null }, d('2026-10-22'))).toBe(true);
  });
  it('přednost má patro, které dlouho nehrál a nejde mu', () => {
    const log = ['letters', 'syllables', 'words', 'reading', 'numbers', 'math', 'writing'].map(level => ({ d: '2026-10-21', level, ok: true }));
    // mluvení nikdy nehrané → vždy mezi prvními třemi; s rng 0 je první
    expect(questLevel({}, log, '2026-10-22', () => 0)).toBe('speech');
  });
  it('kolo bez chyby až po dvou kolech v patře, procvičování jen když je co procvičovat', () => {
    for (let i = 0; i < 50; i++) {
      const q = pickQuest({}, {}, [], '2026-10-22', false, seeded(i));
      expect(q.kind).toBe('rounds');
      expect(q.need).toBe(2);
    }
    const kinds = new Set(Array.from({ length: 80 }, (_, i) => pickQuest({}, { letters: 5, syllables: 5, words: 5, reading: 5, numbers: 5, math: 5, writing: 5, speech: 5 }, [], '2026-10-22', true, seeded(i)).kind));
    expect([...kinds].sort()).toEqual(['perfect', 'practice', 'rounds']);
  });
  it('postup: jen povedená kola ve správném patře, splnění jen jednou', () => {
    const q = { kind: 'rounds' as const, level: 'speech', need: 2, got: 0, done: false };
    expect(questStep(q, 'letters', true, true)).toBe(false);
    expect(questStep(q, 'speech', false, false)).toBe(false);
    expect(questStep(q, 'speech', true, false)).toBe(false);
    expect(q.got).toBe(1);
    expect(questStep(q, 'speech', true, false)).toBe(true);
    expect(questStep(q, 'speech', true, false)).toBe(false);
    const p = { kind: 'perfect' as const, level: 'math', need: 1, got: 0, done: false };
    expect(questStep(p, 'math', true, false)).toBe(false);
    expect(questStep(p, 'math', true, true)).toBe(true);
  });
  it('zadání slovy', () => {
    expect(questText({ kind: 'rounds', level: 'speech', need: 2, got: 0, done: false }, 'Mluvení')).toBe('Zahraj dvě povedená kola v patře Mluvení');
    expect(questText({ kind: 'practice', level: 'practice', need: 1, got: 0, done: false }, 'Procvičit')).toBe('Zahraj jedno kolo Procvičit');
  });
});
