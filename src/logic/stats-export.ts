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

/* ---------- dodatečné poslání starších kol (Ondřej 3. 11. 2026) ---------- */
// Kola odehraná před zapnutím online jsou jen v deníku v zařízení (save.log, jen kola, úlohy jednotlivě ne).
// Pošlou se ta, která jsou starší než nejstarší kolo v databázi; opakované poslání proto nic nezdvojí.
export interface OldRound { t: number; level: string; clean: number; done: number; len: number; ok: boolean; quit: boolean; secs: number; rate?: number; pauses?: number; pauseSecs?: number; lost?: number }
export const BACKFILL_MARK = 'Dodatečně'; // sloupec u dodatečně poslaných kol (server je nepočítá do týdenních bodů)
// starší záznamy můžou mít hodinu bez nuly (2026-10-19 7:17:37); pro porovnání jako text se doplní
export const normStamp = (s: string): string => s.trim().replace(/ (\d):/, ' 0$1:');
export function earliestStamp(rows: StatRow[]): string | null {
  const s = rows.map(r => r['Čas']).filter((x): x is string => typeof x === 'string' && x.length > 0).map(normStamp).sort();
  return s[0] || null;
}
// stamp = místní čas kola ve tvaru 2026-10-20 07:05:09 (logic/sync.ts localStamp, porovnává se jako text)
export function oldRoundRows(log: readonly OldRound[], before: string | null, stamp: (t: number) => string, levelName: (lv: string) => string, extra: StatRow = {}): StatRow[] {
  return log.filter(e => before === null || stamp(e.t) < before).map(e => ({
    Čas: stamp(e.t), ...extra, Druh: 'kolo', Patro: levelName(e.level), 'Bez chyby': e.clean, Úloh: e.len, Hotovo: e.done,
    Povedené: e.ok ? 'ano' : 'ne', Odešel: e.quit ? 'ano' : 'ne', Sekundy: e.secs,
    ...(e.rate ? { Hodnocení: e.rate } : {}), ...(e.pauses ? { Pauzy: e.pauses, 'Pauza (s)': e.pauseSecs || 0 } : {}),
    ...(e.lost ? { 'Ztracené smaragdy': e.lost } : {}), [BACKFILL_MARK]: 'ano',
  }));
}
