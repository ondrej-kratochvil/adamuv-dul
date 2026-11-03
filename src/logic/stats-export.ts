// Stažení statistik z databáze Schoolcraft (Ondřej 3. 11. 2026: „abychom Google tabulku už nepotřebovali“).
// Řádky jsou stejné jako do tabulky Google (pole Druh: kolo, úloha, hodnocení); soubor CSV pro Excel i Tabulky Google.
export type StatRow = Record<string, unknown>;
export const STAT_KINDS = { kolo: 'kola', 'úloha': 'ulohy', 'hodnocení': 'hodnoceni' } as const;
export type StatKind = keyof typeof STAT_KINDS;
export const EXPORT_PAGE = 1000; // řádků na jednu stránku z API (worker/index.ts)

// sloupce v pořadí prvního výskytu; Čas první, Druh se vynechá (soubor je pro jeden druh)
export function columns(rows: StatRow[]): string[] {
  const out: string[] = ['Čas'];
  for (const r of rows) for (const k of Object.keys(r)) if (k !== 'Druh' && !out.includes(k)) out.push(k);
  return out;
}
const cell = (v: unknown): string => {
  const s = v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
// středník a BOM: český Excel ho otevře rovnou správně (i s háčky), Tabulky Google také
export function toCsv(rows: StatRow[]): string {
  const cols = columns(rows);
  return '﻿' + [cols.map(cell).join(';'), ...rows.map(r => cols.map(c => cell(r[c])).join(';'))].join('\r\n') + '\r\n';
}
export const fileName = (kind: StatKind, day: string, who = ''): string =>
  `schoolcraft-${STAT_KINDS[kind]}${who ? '-' + who.normalize('NFD').replace(/[^\w-]/g, '').toLowerCase() : ''}-${day}.csv`;
export const validKind = (k: unknown): k is StatKind => typeof k === 'string' && k in STAT_KINDS;
