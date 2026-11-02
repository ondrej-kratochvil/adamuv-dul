// Texty žebříčku: skloňování podle čísla a osoby (Ondřej 2. 11. 2026: „vede ty“, „1 mláďat“).
import { describe, expect, it } from 'vitest';
import { badges, count, leadSpeech, list, rowSpeech, withPoints } from '../../src/logic/leaders';

describe('čísla a tvary', () => {
  it('1, 2 až 4, 0 a 5 a víc', () => {
    const f = ['mládě', 'mláďata', 'mláďat'] as const;
    expect([0, 1, 2, 4, 5, 12].map(n => count(n, f))).toEqual(['0 mláďat', '1 mládě', '2 mláďata', '4 mláďata', '5 mláďat', '12 mláďat']);
    expect([1, 3, 15].map(withPoints)).toEqual(['s 1 bodem', 's 3 body', 's 15 body']);
    expect(list(['a'])).toBe('a');
    expect(list(['a', 'b', 'c'])).toBe('a, b a c');
  });
});

describe('vedoucí hráč', () => {
  it('ty vedeš: „Vedeš ty“, ne „Vede ty“', () => {
    const t = leadSpeech([{ nick: 'Adam', points: 15, me: true }, { nick: 'Víťa', points: 3 }]);
    expect(t).toContain('Vedeš ty s 15 body.');
    expect(t).not.toMatch(/Vede ty/);
  });
  it('vede jiný: „Vede Víťa s 15 body. Ty máš 1 bod.“', () => {
    expect(leadSpeech([{ nick: 'Víťa', points: 15 }, { nick: 'Adam', points: 1, me: true }])).toBe('Žebříček tohoto týdne. Vede Víťa s 15 body. Ty máš 1 bod.');
    expect(leadSpeech([{ nick: 'Víťa', points: 1 }])).toContain('Vede Víťa s 1 bodem.');
  });
  it('shoda se mnou: jsem až druhý a hra povzbudí k bodu navíc', () => {
    expect(leadSpeech([{ nick: 'Víťa', points: 5 }, { nick: 'Adam', points: 5, me: true }, { nick: 'Ema', points: 2 }])).toBe('Žebříček tohoto týdne. Vede Víťa s 5 body. Ty máš taky 5 bodů. Získej ještě jeden bod a budeš první!');
  });
  it('shoda dvou jiných: „Vedou spolu“ (ne „Vedete“, Adam mezi nimi není)', () => {
    expect(leadSpeech([{ nick: 'Víťa', points: 5 }, { nick: 'Ema', points: 5 }, { nick: 'Adam', points: 2, me: true }])).toBe('Žebříček tohoto týdne. Vedou spolu Víťa a Ema s 5 body. Ty máš 2 body.');
  });
  it('nikdo nemá body, prázdný žebříček', () => {
    expect(leadSpeech([{ nick: 'Adam', points: 0, me: true }])).toContain('Zatím nikdo nemá žádný bod');
    expect(leadSpeech([])).toBe('Žebříček je zatím prázdný.');
  });
});

describe('odznáčky', () => {
  it('jedno mládě, jedno zvířátko, jedna budova, jeden díl', () => {
    const b = badges({ house: 1, farm: 1, village: 1, pets: 1, babies: 1, streak: 2, dragon: 1 }, 10);
    const screen = b.map(x => x[1]), voice = b.map(x => x[2]);
    expect(screen).toEqual(expect.arrayContaining(['1 mládě', '1 zvířátko', '1 budova ve vesnici', 'řada 2 dny']));
    expect(voice).toEqual(expect.arrayContaining(['1 díl domu', '1 díl farmy', '1 hotovou budovu ve vesnici', '1 zvířátko', '1 mládě na farmě', 'řadu 2 dny', 'poraženého draka']));
  });
  it('víc kusů: 2 mláďata, 5 zvířátek, 3 hotové budovy, řada 5 dní', () => {
    const b = badges({ house: 12, farm: 10, village: 3, pets: 5, babies: 2, streak: 5, dragon: 2 }, 10);
    expect(b.map(x => x[1])).toEqual(expect.arrayContaining(['dům hotový', '2 mláďata', '5 zvířátek', '3 budovy ve vesnici', 'řada 5 dní']));
    expect(b.map(x => x[2])).toEqual(expect.arrayContaining(['hotový dům', 'hotovou farmu', '3 hotové budovy ve vesnici', '2 mláďata na farmě', 'draka poraženého 2krát']));
  });
  it('žádný tvar jako „1 mláďat“, „1 hotových“ nebo „2 dní“', () => {
    for (let n = 1; n <= 12; n++) for (const [, a, c] of badges({ house: n, farm: n, village: n, pets: n, babies: n, streak: n }, 10)) {
      const t = a + ' | ' + c;
      expect(t).not.toMatch(/\b1 (mláďat|zvířátek|hotových|budov|dílů|dní)\b/);
      expect(t).not.toMatch(/\b[234] (mláďat|zvířátek|hotových|budov |dílů|dní)\b/);
    }
  });
  it('věta po klepnutí na hráče: výčet s „a“', () => {
    const b = badges({ house: 12, pets: 2 }, 10);
    expect(rowSpeech({ nick: 'Víťa', points: 1 }, b, ['hotový dům'])).toBe('Víťa má 1 bod. Má hotový dům a 2 zvířátka. To ty ještě nemáš: hotový dům.');
    expect(rowSpeech({ nick: 'Adam', points: 4, me: true }, [], [])).toBe('Ty máš 4 body.');
  });
});
