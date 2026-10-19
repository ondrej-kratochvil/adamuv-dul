// Výběr hlášek rodiny: vlastní věty častěji než společné, stejná věta nejdřív po pěti jiných, máma připomíná podle času.
import { MOM_PLAY_LIMIT_MIN, MOM_PLAY_TEXT, MOM_SLOTS } from '../content/family-lines';
import { pad2 } from './calendar';
import type { Rng } from './random';

export const OWN_SHARE = .7;   // podíl vlastních vět člověka
export const NO_REPEAT = 5;    // stejná věta nejdřív po tolika jiných

// vybere větu: ze 70 % vlastní, jinak společnou; vynechá nedávno řečené (když to jde)
export function pickLine(own: string[], common: string[], recent: readonly string[], rng: Rng = Math.random): string {
  const fresh = (xs: string[]) => xs.filter(x => !recent.includes(x));
  const ownFirst = own.length > 0 && (rng() < OWN_SHARE || !common.length);
  const [first, second] = ownFirst ? [own, common] : [common, own];
  // nejdřív nová věta z vybrané skupiny, pak nová z druhé, a teprve když už nic, ta nejdéle neřečená
  const pool = fresh(first).length ? fresh(first) : fresh(second).length ? fresh(second) : null;
  if (pool) return pool[Math.floor(rng() * pool.length)];
  const all = [...own, ...common];
  return all.sort((x, y) => recent.indexOf(x) - recent.indexOf(y))[0];
}
export const remember = (recent: string[], line: string): string[] => [...recent.filter(x => x !== line), line].slice(-NO_REPEAT);

const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

// připomínka mámy pro tuto chvíli, která dnes ještě nezazněla (null = žádná)
export function momReminder(now: Date, playedTodaySecs: number, saidToday: readonly string[]): { id: string; text: string } | null {
  const t = hhmm(now), we = isWeekend(now);
  for (const s of MOM_SLOTS) {
    if ((s.weekday && we) || (s.weekend && !we)) continue;
    if (t >= s.from && t <= s.to && !saidToday.includes(s.id)) return { id: s.id, text: s.text };
  }
  if (playedTodaySecs >= MOM_PLAY_LIMIT_MIN * 60 && !saidToday.includes('dlouho')) return { id: 'dlouho', text: MOM_PLAY_TEXT };
  return null;
}
