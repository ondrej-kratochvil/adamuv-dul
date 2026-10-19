// Očarování výbavy (podle Minecraftu). Odemykají se za zvládnuté úkoly, viz logic/rewards.ts.
export type Piece = 'pick' | 'hat' | 'shirt' | 'pants' | 'shoes' | 'sword' | 'axe' | 'shovel' | 'hoe';
export const PIECES: [Piece, string][] = [['pick', 'krumpáč'], ['hat', 'helma'], ['shirt', 'brnění'], ['pants', 'chrániče'], ['shoes', 'boty'], ['sword', 'meč'], ['axe', 'sekera'], ['shovel', 'lopata'], ['hoe', 'motyka']];
export const ENCHANTS: Record<Piece, [string, number][]> = {
  pick: [['Efektivita', 5], ['Štěstí', 3], ['Nezlomnost', 3]],
  hat: [['Ochrana', 4], ['Nezlomnost', 3], ['Dýchání', 3], ['Afinita k vodě', 1]],
  shirt: [['Ochrana', 4], ['Nezlomnost', 3], ['Trny', 3]],
  pants: [['Ochrana', 4], ['Nezlomnost', 3], ['Rychlé plížení', 3]],
  shoes: [['Ochrana', 4], ['Nezlomnost', 3], ['Tichý pád', 4], ['Rychlost v hlubinách', 3]],
  sword: [['Ostrost', 5], ['Odhození', 2], ['Ohnivá čepel', 2]],
  axe: [['Efektivita', 5], ['Nezlomnost', 3]],
  shovel: [['Efektivita', 5], ['Nezlomnost', 3]],
  hoe: [['Efektivita', 5], ['Nezlomnost', 3]],
};
export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

export interface Enchant { pc: Piece; name: string; lvl: number; key: string }
// pořadí odměn: postupně všem kusům po jedné úrovni, Opravování (nejvzácnější) až na úplný konec
export const ENCH_ORDER: Enchant[] = (() => {
  const out: Enchant[] = [];
  for (let lvl = 1; lvl <= 5; lvl++) PIECES.forEach(([pc]) => ENCHANTS[pc].forEach(([name, max]) => { if (lvl <= max) out.push({ pc, name, lvl, key: `${pc}:${name}:${lvl}` }); }));
  PIECES.forEach(([pc]) => out.push({ pc, name: 'Opravování', lvl: 1, key: `${pc}:Opravování:1` }));
  return out;
})();
