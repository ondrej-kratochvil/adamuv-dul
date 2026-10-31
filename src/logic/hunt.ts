// Hledání pokladu s písmeny (Ondřej 31. 10. 2026): „Najdi doma něco, co začíná na M, a vyfoť to.“ Rodič potvrdí,
// hra nic nehodnotí sama. Fotky zůstávají jen v zařízení (app/photos.js), sem se ukládá jen písmeno a den.
import { type Rng } from './random';

export const HUNT_BONUS = 3;     // smaragdy za potvrzený poklad
export const HUNT_PER_DAY = 3;   // odměněné poklady za den (víc jde hledat, ale bez smaragdů)
export interface Hunt { d: string; today: string[]; total: number }
export const huntDefaults = (): Hunt => ({ d: '', today: [], total: 0 });
// den se změnil: dnešní seznam začíná znovu
export const huntToday = (h: Hunt, day: string): Hunt => h.d === day ? h : { ...h, d: day, today: [] };
// písmeno k hledání: ze známých (samohlásky vždy + zapnuté souhlásky), ne dnes už nalezené, ne Ů a Ý (slovo jimi nezačíná)
const NO_START = new Set(['Ů', 'Ý', 'Y', 'Ě']);
export function huntLetters(cons: string[]): string[] {
  return ['A', 'E', 'I', 'O', 'U', ...cons.map(c => c.toUpperCase())].filter((c, i, a) => !NO_START.has(c) && a.indexOf(c) === i);
}
export function pickHuntLetter(cons: string[], h: Hunt, last: string, rng: Rng = Math.random): string {
  const all = huntLetters(cons), fresh = all.filter(c => !h.today.includes(c) && c !== last);
  const pool = fresh.length ? fresh : all.filter(c => c !== last);
  return pool[Math.floor(rng() * pool.length)] || all[0];
}
// potvrzený poklad: smaragdy jen za první nález písmene dnes a jen prvních HUNT_PER_DAY za den
export function huntFound(h0: Hunt, letter: string, day: string): { hunt: Hunt; bonus: number } {
  const h = huntToday(h0, day);
  const bonus = !h.today.includes(letter) && h.today.length < HUNT_PER_DAY ? HUNT_BONUS : 0;
  return { hunt: { d: day, today: h.today.includes(letter) ? h.today : [...h.today, letter], total: h.total + 1 }, bonus };
}
// zmenšení fotky pro uložení (delší strana nejvýš max px)
export function fitSize(w: number, h: number, max = 640): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h, 1));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}
