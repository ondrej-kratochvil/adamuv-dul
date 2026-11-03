// Stažení statistik z databáze jako CSV (Ondřej 3. 11. 2026).
import { describe, expect, it } from 'vitest';
import { columns, earliestStamp, fileName, oldRoundRows, toCsv, validKind } from '../../src/logic/stats-export';
import { localStamp } from '../../src/logic/sync';

describe('statistiky do CSV', () => {
  it('sloupce: Čas první, pak v pořadí výskytu, bez Druh', () => {
    expect(columns([{ Druh: 'kolo', Patro: 'Slova', Čas: 'x' }, { Patro: 'Čísla', Hodnocení: 8 }])).toEqual(['Čas', 'Patro', 'Hodnocení']);
  });
  it('středník, BOM a uvozovky jen kde je potřeba', () => {
    const csv = toCsv([{ Čas: '2026-11-02 7:50:00', Druh: 'úloha', Úloha: 'a;b', Záměna: 'řekl "SAM"', Sekundy: 3.5 }, { Čas: 't', Chybí: undefined }]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('﻿Čas;Úloha;Záměna;Sekundy;Chybí');
    expect(lines[1]).toBe('2026-11-02 7:50:00;"a;b";"řekl ""SAM""";3.5;');
    expect(lines[2]).toBe('t;;;;');
  });
  it('název souboru bez diakritiky, druh jen známý', () => {
    expect(fileName('úloha', '2026-11-03', 'Adámek')).toBe('schoolcraft-ulohy-adamek-2026-11-03.csv');
    expect(fileName('kolo', '2026-11-03')).toBe('schoolcraft-kola-2026-11-03.csv');
    expect(['kolo', 'úloha', 'hodnocení', 'x', '', null].map(validKind)).toEqual([true, true, true, false, false, false]);
  });
});

describe('dodatečné poslání starších kol', () => {
  const t = (s: string) => new Date(s).getTime();
  const e = (when: string, extra = {}) => ({ t: t(when), level: 'numbers', clean: 7, done: 8, len: 8, ok: true, quit: false, secs: 40, ...extra });
  const log = [e('2026-10-19T07:17:37'), e('2026-10-25T08:42:36', { rate: 8, lost: 2 }), e('2026-10-27T18:00:00')];
  it('nejstarší čas v databázi (text s nulami se porovná správně)', () => {
    expect(earliestStamp([{ Čas: '2026-10-26 18:00:00' }, { Čas: '2026-10-26 07:05:00' }, {}])).toBe('2026-10-26 07:05:00');
    expect(earliestStamp([])).toBeNull();
    expect(earliestStamp([{ Čas: '2026-10-26 10:00:00' }, { Čas: '2026-10-26 7:05:00' }])).toBe('2026-10-26 07:05:00'); // hodina bez nuly
  });
  it('jen kola starší než nejstarší v databázi, se sloupcem Dodatečně; prázdná databáze = všechna', () => {
    const rows = oldRoundRows(log, '2026-10-26 07:05:00', localStamp, () => 'Čísla');
    expect(rows.map(r => r['Čas'])).toEqual(['2026-10-19 07:17:37', '2026-10-25 08:42:36']);
    expect(rows[1]).toMatchObject({ Druh: 'kolo', Patro: 'Čísla', 'Bez chyby': 7, Povedené: 'ano', Odešel: 'ne', Hodnocení: 8, 'Ztracené smaragdy': 2, Dodatečně: 'ano' });
    expect(oldRoundRows(log, null, localStamp, x => x)).toHaveLength(3);
    // po poslání je nejstarší v databázi nejstarší kolo z deníku: znovu se nepošle nic
    expect(oldRoundRows(log, '2026-10-19 07:17:37', localStamp, x => x)).toHaveLength(0);
  });
});
