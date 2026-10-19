// Řada dní: den se počítá, když má Adam aspoň jedno povedené kolo.
// Totem (z obchodu) zachrání řadu při jednom vynechaném dni.
import { dayNum } from './calendar';

export interface Streak { count: number; best: number; last: string; totem: number; days: string[] }
export const STREAK_BONUS_MAX = 10;
export const DAYS_KEPT = 60;

// jak řada stojí v daný den (bez zápisu)
export function streakAt(st: Streak, today: string): { count: number; today: boolean; saved: boolean } {
  if (!st.last) return { count: 0, today: false, saved: false };
  const gap = dayNum(today) - dayNum(st.last);
  if (gap === 0) return { count: st.count, today: true, saved: false };
  if (gap === 1) return { count: st.count, today: false, saved: false };
  if (gap === 2 && st.totem > 0) return { count: st.count, today: false, saved: true };
  return { count: 0, today: false, saved: false };
}

export interface DayResult { count: number; bonus: number; usedTotem: boolean; prevBest: number }

// zapíše den do řady (mění st); vrací null, když už je den započítaný
export function applyDay(st: Streak, today: string): DayResult | null {
  if (st.last === today) return null;
  const gap = st.last ? dayNum(today) - dayNum(st.last) : Infinity;
  let usedTotem = false;
  if (gap === 1) st.count++;
  else if (gap === 2 && st.totem > 0) { st.totem--; st.count++; usedTotem = true; }
  else st.count = 1;
  const prevBest = st.best;
  st.last = today;
  st.best = Math.max(st.best, st.count);
  st.days = [...st.days.filter(d => dayNum(today) - dayNum(d) < DAYS_KEPT), today];
  return { count: st.count, bonus: Math.min(st.count, STREAK_BONUS_MAX), usedTotem, prevBest };
}
