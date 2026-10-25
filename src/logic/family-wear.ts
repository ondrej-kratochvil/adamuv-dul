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

// Více kusů stejné věci (Ondřej 25. 10. 2026): každý další kus se kupuje zvlášť, nejvýš tolik, kolik je členů rodiny.
// Koupené kusy = kolikrát je věc v save.famOwned. Kdo už věc nosí víc, než je kusů (z doby před tímto pravidlem), tomu zůstane.
export const ownedCount = (owned: readonly string[], item: string): number => owned.filter(x => x === item).length;
export const wornCount = (fw: FamWear, item: string): number => Object.values(fw).filter(c => Object.values(c).includes(item)).length;
export const wears = (fw: FamWear, person: string, item: string): boolean => Object.values(fw[person] || {}).includes(item);
// co se stane po klepnutí na věc u člověka: sundat, nasadit volný kus, koupit první, nebo koupit další kus
export type WearAction = 'off' | 'on' | 'buy' | 'buyMore' | 'max';
export function wearAction(fw: FamWear, owned: readonly string[], person: string, item: string, familySize: number): WearAction {
  if (wears(fw, person, item)) return 'off';
  const n = ownedCount(owned, item);
  if (!n) return 'buy';
  if (wornCount(fw, item) < n) return 'on';
  return n >= familySize ? 'max' : 'buyMore';
}
