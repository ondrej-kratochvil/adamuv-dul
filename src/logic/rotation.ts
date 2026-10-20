// Střídání pater (Ondřej 20. 10. 2026: Adam hrál pořád dokola jedno patro). Po 3 kolech stejného patra za sebou si patro
// dá pauzu; otevře se zase po kole jiného patra (i Procvičování). Odchody z kola se nepočítají ani nepřerušují.
export const SAME_FLOOR_MAX = 3;
export interface RoundEntry { level: string; quit: boolean }

// které patro teď odpočívá (null = žádné)
export function restingLevel(log: readonly RoundEntry[], floors: readonly string[]): string | null {
  let lv = '', n = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]; if (e.quit) continue;
    if (!lv) lv = e.level;
    if (e.level !== lv) break;
    n++;
    if (n >= SAME_FLOOR_MAX) return floors.includes(lv) ? lv : null;
  }
  return null;
}
// které patro doporučit místo něj: to, které Adam hrál nejdéle (nebo vůbec), jinak první v pořadí
export function suggestLevel(log: readonly RoundEntry[], floors: readonly string[], except: string): string {
  const last: Record<string, number> = {};
  log.forEach((e, i) => { last[e.level] = i; });
  return floors.filter(f => f !== except).sort((a, b) => (last[a] ?? -1) - (last[b] ?? -1))[0];
}
