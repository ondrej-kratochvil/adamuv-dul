// Stavění: Adam staví z kostek, které sám vykopal. Odemkne se po dostavěném domě.
export const BUILD_UNLOCK = 12;          // povedených kol (= dostavěný dům)
export const PLOT_W = 16, PLOT_H = 9;    // stavební plocha v kostkách (nad trávou)

export interface Build { blocks: Record<string, number>; placed: Record<string, string> }
export type TapResult = 'placed' | 'removed' | 'swapped' | 'none';

// vykopané kostky z kola do zásoby
export function addBlocks(b: Build, types: readonly string[]): void {
  for (const t of types) b.blocks[t] = (b.blocks[t] || 0) + 1;
}

const key = (x: number, y: number) => `${x},${y}`;
export const inPlot = (x: number, y: number): boolean => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < PLOT_W && y >= 0 && y < PLOT_H;

// klepnutí na políčko: položit vybranou kostku, vzít kostku zpět (krumpáč nebo stejná kostka), nebo vyměnit
// kostky se nikdy neztratí: co se z plochy vezme, vrátí se do zásoby
export function tapCell(b: Build, x: number, y: number, selected: string | null, erase: boolean): TapResult {
  if (!inPlot(x, y)) return 'none';
  const k = key(x, y), here = b.placed[k];
  if (here && (erase || here === selected)) { delete b.placed[k]; b.blocks[here] = (b.blocks[here] || 0) + 1; return 'removed'; }
  if (erase || !selected || !(b.blocks[selected] > 0)) return 'none';
  b.blocks[selected]--;
  b.placed[k] = selected;
  if (here) { b.blocks[here] = (b.blocks[here] || 0) + 1; return 'swapped'; }
  return 'placed';
}

// kolik kostek má Adam celkem (v zásobě i postavených)
export const totalBlocks = (b: Build): number => Object.values(b.blocks).reduce((a, n) => a + n, 0) + Object.keys(b.placed).length;

// Klepnutí na trávu nebo hlínu: staví se od země jako v Minecraftu. Kostka padne na nejnižší volné místo ve sloupci,
// krumpáč vezme nejvyšší kostku ve sloupci.
export function tapGround(b: Build, x: number, selected: string | null, erase: boolean): TapResult {
  if (!inPlot(x, 0)) return 'none';
  if (erase) {
    for (let y = 0; y < PLOT_H; y++) if (b.placed[key(x, y)]) return tapCell(b, x, y, null, true);
    return 'none';
  }
  for (let y = PLOT_H - 1; y >= 0; y--) if (!b.placed[key(x, y)]) return tapCell(b, x, y, selected, false);
  return 'none';
}
