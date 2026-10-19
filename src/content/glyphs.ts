// Tahy pro patro Psaní: číslice, tiskací písmena a uvolňovací cviky v rámečku 100 × 140 (SVG cesty).
// tahy číslic v rámečku 100 × 140, jak se píšou ve škole (pořadí a směr tahů)
// Archimédova spirála: střed, počáteční poloměr, rozestup závitů, počet půlotáček
export function spiralPath(cx: number, cy: number, r0: number, gap: number, halfTurns: number): string {
  const pts: string[] = [];
  for (let t = 0; t <= Math.PI * halfTurns; t += .12) { const r = r0 + gap * t / (2 * Math.PI); pts.push((cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1)); }
  return 'M' + pts.join(' L');
}
export const GLYPHS: Record<string, string[]> = {
  '0': ['M50 15 C16 15 18 125 50 125 C82 125 84 15 50 15'],
  '1': ['M30 52 L62 15 L62 125'],
  '2': ['M24 45 C24 8 80 6 78 44 C76 72 42 95 22 125 L82 125'],
  '3': ['M24 32 C38 4 86 10 76 44 C70 62 56 66 44 66 C62 66 86 76 80 100 C74 132 30 132 21 110'],
  '4': ['M58 15 L20 90 L85 90', 'M66 52 L66 125'],
  '5': ['M33 15 L28 66 C46 54 84 58 80 93 C76 130 34 130 21 112', 'M33 15 L78 15'],
  '6': ['M72 18 C40 18 22 58 24 94 C26 130 78 130 78 98 C78 66 34 64 26 92'],
  '7': ['M22 18 L80 18 L42 125'],
  '8': ['M70 36 C70 10 30 10 30 36 C30 62 76 68 76 98 C76 130 24 130 24 98 C24 68 70 62 70 36'],
  '9': ['M74 42 C70 12 28 12 27 42 C26 72 72 72 74 44 L68 125'],
};
// tiskací písmena ze hry a uvolňovací cviky (vlnka, cikcak…), stejný rámeček
Object.assign(GLYPHS, {
  A: ['M50 15 L18 125', 'M50 15 L82 125', 'M32 84 L68 84'],
  E: ['M28 15 L28 125', 'M28 15 L78 15', 'M28 70 L70 70', 'M28 125 L78 125'],
  I: ['M50 15 L50 125'],
  O: ['M50 15 C14 15 14 125 50 125 C86 125 86 15 50 15'],
  U: ['M22 15 L22 90 C22 130 78 130 78 90 L78 15'],
  Y: ['M20 15 L50 68', 'M80 15 L50 68 L50 125'],
  M: ['M18 125 L18 15 L50 85 L82 15 L82 125'],
  L: ['M28 15 L28 125 L78 125'],
  S: ['M76 28 C66 8 24 10 24 40 C24 68 78 66 78 98 C78 132 30 132 22 110'],
  vlnka: ['M8 70 C18 38 30 38 38 70 C46 102 58 102 66 70 C74 38 84 38 92 70'],
  cikcak: ['M8 92 L24 48 L40 92 L56 48 L72 92 L90 48'],
  kopecky: ['M8 100 C8 48 36 48 36 100 C36 48 64 48 64 100 C64 48 92 48 92 100'],
  smycka: ['M6 114 C34 114 74 98 74 58 A24 24 0 1 0 26 58 C26 98 66 114 94 114'],
  spirala: [spiralPath(50, 72, 5, 24, 3.2)],
});
export const SHAPE_NAMES: Record<string, string> = { vlnka: 'vlnku', cikcak: 'cikcak', kopecky: 'kopečky', smycka: 'smyčku', spirala: 'spirálu' };
