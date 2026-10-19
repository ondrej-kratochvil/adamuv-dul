// Dlouhodobé odměny podle zvládnutých úkolů.
// Pravidlo: maximum má Adam až ve chvíli, kdy zvládne všechno, co hra obsahuje. Získané odměny se nikdy neberou.
import { ENCH_ORDER, type Enchant, type Piece } from '../content/enchants';

// odměna č. i potřebuje ceil((i + 1) / počet_odměn × počet_úkolů) zvládnutých
export const enchantNeed = (i: number, max: number): number => Math.ceil((i + 1) / ENCH_ORDER.length * max);

// očarování, na která má Adam nárok a ještě je nemá (pořadí podle ENCH_ORDER)
export function newEnchants(pts: number, max: number, owned: readonly string[]): Enchant[] {
  return ENCH_ORDER.filter((e, i) => !owned.includes(e.key) && pts >= enchantNeed(i, max));
}

// nejvyšší úroveň každého očarování daného kusu
export function pieceEnchants(owned: readonly string[], pc: Piece): Record<string, number> {
  const best: Record<string, number> = {};
  owned.filter(k => k.startsWith(pc + ':')).forEach(k => { const [, name, l] = k.split(':'); best[name] = Math.max(best[name] || 0, +l); });
  return best;
}

// další očarování v pořadí a kolik zvládnutých úkolů k němu chybí
export function nextEnchant(pts: number, max: number, owned: readonly string[]): { e: Enchant; left: number } | null {
  const i = ENCH_ORDER.findIndex(e => !owned.includes(e.key));
  return i < 0 ? null : { e: ENCH_ORDER[i], left: Math.max(0, enchantNeed(i, max) - pts) };
}

// Ochrana: zaseknutí krumpáče po chybě kratší o 50 ms za úroveň, nejkratší 1,2 s
export const STUCK_MS = 2000;
export const stuckMsFor = (protection: number): number => Math.max(1200, STUCK_MS - 50 * protection);

// vesnice: 8 fází budovy podle podílu zvládnutých úkolů patra; hotová až při 100 %
export const BUILDING_STAGES = 8;
export const buildingStage = (got: number, all: number): number => got >= all ? BUILDING_STAGES : Math.min(BUILDING_STAGES - 1, Math.floor(got / all * BUILDING_STAGES));

// oči Enderu podle celkového podílu; portál do Endu až se všemi
export const EYES = 12;
export const eyesFor = (pts: number, max: number): number => Math.min(EYES, Math.floor(pts / max * EYES));
