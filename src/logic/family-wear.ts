// Převlékání rodiny: co kdo má na sobě (save.famWear) a co Adam vlastní (save.famOwned).
import { WEAR, wearById, type Slot } from '../content/family-wear';

export type FamWear = Record<string, Partial<Record<Slot, string>>>;

// nasadí kousek; když ho člověk už má, sundá ho; na jednom místě jen jeden kousek. Vrací true = nasazeno.
export function toggleWear(fw: FamWear, person: string, item: string): boolean {
  const w = wearById(item); if (!w) return false;
  const cur = fw[person] || (fw[person] = {});
  if (cur[w.slot] === item) { delete cur[w.slot]; if (!Object.keys(cur).length) delete fw[person]; return false; }
  cur[w.slot] = item; return true;
}
// kousky, které má člověk na sobě, v pořadí kreslení (hlava poslední, ať přikryje vlasy)
export function wornItems(fw: FamWear, person: string): string[] {
  const cur = fw[person] || {};
  return (['mouth', 'nose', 'eyes', 'head'] as Slot[]).map(s => cur[s]).filter((x): x is string => !!x && !!wearById(x));
}
export const wearCount = (fw: FamWear): number => Object.values(fw).reduce((a, c) => a + Object.keys(c).length, 0);
export const WEAR_IDS = WEAR.map(w => w.id);
