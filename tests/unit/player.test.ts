import { describe, expect, it } from 'vitest';
import { blankPlayer, exportPlayer, g, guessForms, importPlayer, normalizePlayer, personalDayOn } from '../../src/logic/player';
import { ADAM } from '../../src/content/player-adam';

describe('tvary jména', () => {
  it('oslovení a přivlastnění podle jména a rodu', () => {
    expect(guessForms('Adam', 'm')).toEqual({ voc: 'Adame', poss: 'Adamův' });
    expect(guessForms('Víťa', 'm')).toEqual({ voc: 'Víťo', poss: 'Víťův' });
    expect(guessForms('Ema', 'f')).toEqual({ voc: 'Emo', poss: 'Emin' });
    expect(guessForms('Marek', 'm')).toEqual({ voc: 'Marku', poss: 'Markův' });
    expect(guessForms('Tomáš', 'm')).toEqual({ voc: 'Tomáši', poss: 'Tomášův' });
    expect(guessForms('Petr', 'm').voc).toBe('Petře');
    expect(guessForms('Vojtěch', 'm').voc).toBe('Vojtěchu');
    expect(guessForms('Leo', 'm').voc).toBe('Leo');
  });
  it('rod hráče', () => {
    expect(g(blankPlayer('Ema', 'f'), 'Splnil', 'Splnila')).toBe('Splnila');
    expect(g(ADAM, 'Splnil', 'Splnila')).toBe('Splnil');
  });
});

describe('soubor hráče', () => {
  it('Adam projde převodem beze změny hlášek a rodiny', () => {
    const p = normalizePlayer(JSON.parse(JSON.stringify(ADAM)))!;
    expect(p.family.map(x => x.id)).toEqual(ADAM.family.map(x => x.id));
    expect(p.family.find(x => x.id === 'iva')!.lines!.cheers).toEqual(ADAM.family.find(x => x.id === 'iva')!.lines!.cheers);
    expect(p.mom!.slots.length).toBe(ADAM.mom!.slots.length);
  });
  it('export a import', () => {
    const p = blankPlayer('Víťa');
    p.family.push({ id: 'vasek', name: 'táta Vašek', gen: 'táty Vaška', f: false, hair: '#4a2a14', top: '#2a4f8a', beard: true });
    const back = importPlayer(exportPlayer(p) + '  \n');
    expect(back).toEqual(p);
  });
  it('nesmysl ani hráč bez jména se nenačte; zlé barvy a dlouhé texty se opraví', () => {
    expect(importPlayer('ahoj')).toBeNull();
    expect(normalizePlayer({ name: '  ' })).toBeNull();
    const p = normalizePlayer({ name: 'X'.repeat(99), family: [{ id: 'a', name: 'teta', hair: 'red; background:url(x)' }] })!;
    expect(p.name.length).toBe(30);
    expect(p.family[0].hair).toBe('#6b4a2a');
  });
});

describe('narozeniny a svátky z hráče', () => {
  it('Adam a Davídek', () => {
    expect(personalDayOn(ADAM, '06-17')?.id).toBe('narozeniny');
    expect(personalDayOn(ADAM, '06-04')).toMatchObject({ id: 'david-narozeniny', who: 'david' });
    expect(personalDayOn(ADAM, '12-30')).toMatchObject({ id: 'david-svatek', who: 'david' });
    expect(personalDayOn(ADAM, '10-24')).toBeNull();
  });
  it('holka: popřej jí', () => {
    const p = blankPlayer('Ema', 'f'); p.family.push({ id: 'mama', name: 'máma', gen: 'mámy', f: true, hair: '#000000', top: '#ffffff', birthday: '03-01' });
    expect(personalDayOn(p, '03-01')?.text).toContain('Popřej jí');
  });
});
