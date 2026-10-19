// Obrázky ke slovům v patře Čtení (pixely 16 × 16). Množné číslo kreslí obrázek třikrát.
export type Painter = (x: number, y: number, w: number, h: number, color: string) => void;
// obrázky 16 × 16; množné číslo (OSY, ÚLY…) kreslí obrázek třikrát, ať Adam čte až do konce slova
export const PIC: Record<string, (R: Painter) => void> = {
  OSA: R => { R(5, 3, 3, 4, '#d6eef8'); R(8, 2, 3, 5, '#eaf7fc'); R(4, 7, 9, 5, '#f2c94c'); R(6, 7, 1, 5, '#1d1712'); R(9, 7, 1, 5, '#1d1712'); R(12, 7, 3, 4, '#1d1712'); R(13, 8, 1, 1, '#ffffff'); R(2, 9, 2, 1, '#1d1712'); R(14, 5, 1, 2, '#1d1712'); },
  OSEL: R => { R(3, 6, 9, 5, '#8d8d8d'); R(3, 11, 2, 4, '#6c6c6c'); R(10, 11, 2, 4, '#6c6c6c'); R(11, 3, 3, 5, '#8d8d8d'); R(13, 5, 3, 3, '#cfc8bc'); R(11, 0, 1, 3, '#6c6c6c'); R(13, 0, 1, 3, '#6c6c6c'); R(2, 6, 1, 4, '#5a5a5a'); R(12, 4, 1, 1, '#111111'); R(4, 10, 7, 1, '#bdbdbd'); },
  LES: R => { ([[1, '#3f8a2a'], [6, '#2f7a23'], [11, '#4c9c33']] as [number, string][]).forEach(([x, c], i) => { R(x, 3 + i % 2, 4, 7, c); R(x + 1, 1 + i % 2, 2, 2, c); R(x + 1, 10, 2, 5, '#6b4a31'); }); },
  LOS: R => { R(2, 7, 10, 5, '#6b4424'); R(3, 12, 2, 4, '#4a2e17'); R(9, 12, 2, 4, '#4a2e17'); R(11, 6, 4, 4, '#6b4424'); R(13, 8, 3, 3, '#5a3820'); R(8, 2, 7, 1, '#e0d2b4'); R(8, 1, 1, 1, '#e0d2b4'); R(11, 1, 1, 1, '#e0d2b4'); R(14, 1, 1, 1, '#e0d2b4'); R(11, 3, 1, 3, '#e0d2b4'); R(12, 7, 1, 1, '#111111'); },
  ÚL: R => { R(2, 3, 12, 12, '#d8a23a'); R(2, 6, 12, 1, '#a8781e'); R(2, 11, 12, 1, '#a8781e'); R(6, 8, 4, 2, '#3a2a10'); R(10, 12, 2, 3, '#f2c94c'); R(12, 0, 3, 2, '#f2c94c'); R(13, 0, 1, 2, '#1d1712'); },
  MASO: R => { R(2, 4, 11, 9, '#c0392b'); R(2, 4, 11, 1, '#f2e4d0'); R(2, 12, 11, 1, '#f2e4d0'); R(5, 7, 2, 1, '#e8a0a0'); R(8, 9, 3, 1, '#e8a0a0'); R(12, 6, 3, 4, '#f0ebe0'); R(14, 5, 2, 2, '#f0ebe0'); R(14, 9, 2, 2, '#f0ebe0'); },
  MÍSA: R => { R(1, 7, 14, 1, '#c9a87a'); R(1, 8, 14, 2, '#8a5a2e'); R(2, 10, 12, 2, '#8a5a2e'); R(4, 12, 8, 2, '#6b4424'); R(3, 6, 10, 1, '#e8862a'); R(5, 5, 2, 1, '#e8862a'); R(9, 5, 3, 1, '#3f8a2a'); },
  SŮL: R => { R(5, 4, 6, 10, '#f4f4f4'); R(4, 4, 1, 10, '#c9c9c9'); R(11, 4, 1, 10, '#c9c9c9'); R(4, 14, 8, 1, '#c9c9c9'); R(5, 1, 6, 3, '#9a9a9a'); R(6, 2, 1, 1, '#333333'); R(9, 2, 1, 1, '#333333'); R(7, 1, 2, 1, '#333333'); R(6, 8, 4, 3, '#dfe8ef'); },
  SUM: R => { R(3, 6, 9, 5, '#7a6a52'); R(3, 10, 9, 1, '#b8a888'); R(0, 4, 3, 2, '#5e5040'); R(0, 10, 3, 2, '#5e5040'); R(1, 6, 2, 4, '#5e5040'); R(11, 6, 4, 5, '#7a6a52'); R(13, 7, 1, 1, '#111111'); R(14, 10, 2, 1, '#3a2a10'); R(14, 12, 2, 1, '#3a2a10'); R(13, 11, 1, 1, '#3a2a10'); R(6, 4, 3, 2, '#5e5040'); },
  LAMA: R => { const W = '#efe4c8'; R(2, 8, 9, 4, W); R(2, 12, 2, 4, W); R(9, 12, 2, 4, W); R(9, 2, 3, 7, W); R(10, 1, 4, 3, W); R(10, 0, 1, 1, W); R(12, 0, 1, 1, W); R(12, 2, 1, 1, '#111111'); R(4, 8, 4, 2, '#c62f2f'); R(4, 10, 4, 1, '#2f7fd1'); R(1, 8, 1, 2, W); },
  SLÁMA: R => { R(1, 3, 14, 12, '#d8b84a'); [3, 6, 9, 12].forEach(x => R(x, 3, 1, 12, '#b8962a')); R(1, 6, 14, 1, '#8a2a17'); R(1, 11, 14, 1, '#8a2a17'); R(1, 3, 14, 1, '#ead27a'); },
  MÁMA: R => { const S = '#d9a066'; R(5, 0, 6, 2, '#6b3a1a'); R(6, 1, 4, 4, S); R(5, 2, 1, 5, '#6b3a1a'); R(10, 2, 1, 5, '#6b3a1a'); R(7, 2, 1, 1, '#2f5ea8'); R(9, 2, 1, 1, '#2f5ea8'); R(7, 4, 2, 1, '#c0392b'); R(4, 5, 8, 7, '#c84a8a'); R(3, 6, 1, 5, S); R(12, 6, 1, 5, S); R(3, 11, 10, 1, '#a83a72'); R(6, 12, 1, 3, S); R(9, 12, 1, 3, S); R(5, 15, 2, 1, '#333333'); R(9, 15, 2, 1, '#333333'); },
};
export const PLURAL: Record<string, string> = { OSY: 'OSA', ÚLY: 'ÚL', LAMY: 'LAMA', MÍSY: 'MÍSA' };
export const PIC_WORDS: string[] = [...Object.keys(PIC), ...Object.keys(PLURAL)];

// Slova, která jsou jen částí názvu na obrázku (Ondřej, 19. 10. 2026): na obrázku je vosa, ale čte se OSA;
// na obrázku je sumec, ale čte se SUM. Tečky ukazují, kde kus slova chybí, a po správné odpovědi hlas řekne celé slovo.
export const PIC_PART: Record<string, { before?: boolean; after?: boolean; full: string }> = {
  OSA: { before: true, full: 'vosa' },
  OSY: { before: true, full: 'vosy' },
  SUM: { after: true, full: 'sumec' },
};
export function partLabel(word: string, shown: string): string {
  const p = PIC_PART[word];
  return p ? `${p.before ? '…' : ''}${shown}${p.after ? '…' : ''}` : shown;
}
