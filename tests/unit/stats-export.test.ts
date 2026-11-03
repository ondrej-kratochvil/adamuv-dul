// Stažení statistik z databáze jako CSV (Ondřej 3. 11. 2026).
import { describe, expect, it } from 'vitest';
import { columns, fileName, toCsv, validKind } from '../../src/logic/stats-export';

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
