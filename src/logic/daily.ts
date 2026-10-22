// Ranní karta (Ondřej 22. 10. 2026): při prvním otevření dne hra řekne den, datum, kdo má svátek a dnešní úkol.
// Za splněný úkol jsou bonusové smaragdy. Hlásí ten, kdo ten den fandí.
import { NAMEDAYS } from '../content/namedays';
import { dayNum, dayStr, easterMonday } from './calendar';
import { levelProgress, LEVEL_KEYS, type Stats } from './mastery';
import type { Rng } from './random';

export const DAILY_BONUS = 5; // víc než kolo bez chyby, míň než narozeniny
export type QuestKind = 'rounds' | 'perfect' | 'practice';
export interface Quest { kind: QuestKind; level: string; need: number; got: number; done: boolean }
export interface Daily { d: string; quest: Quest | null }

const DAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const ORD = ['', 'prvního', 'druhého', 'třetího', 'čtvrtého', 'pátého', 'šestého', 'sedmého', 'osmého', 'devátého', 'desátého',
  'jedenáctého', 'dvanáctého', 'třináctého', 'čtrnáctého', 'patnáctého', 'šestnáctého', 'sedmnáctého', 'osmnáctého', 'devatenáctého', 'dvacátého'];
// 22 → „dvacátého druhého“ (hlas by „22.“ přečetl různě, rok se vynechává)
export function ordinalGen(n: number): string {
  if (n <= 20) return ORD[n];
  const tens = n >= 30 ? 'třicátého' : 'dvacátého';
  return n % 10 ? `${tens} ${ORD[n % 10]}` : tens;
}
export const dateShow = (d: Date): string => `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
export const dateSay = (d: Date): string => `${DAYS[d.getDay()]} ${ordinalGen(d.getDate())} ${MONTHS[d.getMonth()]}`;

// kdo má svátek: „Sabina“, „Šarlota a Zoe“, „Kašpar, Melichar a Baltazar“; null = den bez jména
export function nameDay(d: Date): string | null {
  const v = NAMEDAYS[dayStr(d).slice(5)];
  if (!v) return null;
  const a = v.split('|');
  return a.length > 1 ? a.slice(0, -1).join(', ') + ' a ' + a[a.length - 1] : a[0];
}

// státní svátky a ostatní svátky (zákon č. 245/2000 Sb.), jak je řekne hra
const STATE: Record<string, string> = {
  '01-01': 'Nový rok', '05-01': 'Svátek práce', '05-08': 'Den vítězství', '07-05': 'Den Cyrila a Metoděje',
  '07-06': 'Den upálení mistra Jana Husa', '09-28': 'Den české státnosti', '10-28': 'Den vzniku Československa',
  '11-17': 'Den boje za svobodu a demokracii', '12-24': 'Štědrý den', '12-25': 'první svátek vánoční', '12-26': 'druhý svátek vánoční',
};
export function stateHoliday(d: Date): string | null {
  const ds = dayStr(d), md = ds.slice(5);
  if (STATE[md]) return STATE[md];
  const em = easterMonday(d.getFullYear());
  if (ds === em) return 'Velikonoční pondělí';
  if (dayNum(ds) === dayNum(em) - 3) return 'Velký pátek';
  return null;
}

export const greeting = (d: Date): string => d.getHours() < 10 ? 'Dobré ráno' : d.getHours() >= 18 ? 'Dobrý večer' : 'Ahoj';

export interface LogLike { d: string; level: string; ok: boolean }
// které patro dnes: méně zvládnuté a dlouho nehrané má přednost; vybírá se z prvních tří
export function questLevel(stats: Stats, log: LogLike[], today: string, rng: Rng = Math.random): string {
  const last: Record<string, string> = {};
  for (const e of log) if (!last[e.level] || e.d > last[e.level]) last[e.level] = e.d;
  const score = (lv: string) => {
    const p = levelProgress(stats, lv), left = 1 - p.got / p.all;
    const idle = last[lv] ? Math.min(14, dayNum(today) - dayNum(last[lv])) : 14;
    return left * 2 + idle / 7;
  };
  const top = [...LEVEL_KEYS].sort((a, b) => score(b) - score(a)).slice(0, 3);
  return top[Math.floor(rng() * top.length)];
}

// dnešní úkol: 2 povedená kola v patře, kolo bez chyby (až po 2 kolech v patře), nebo Procvičování (když je co procvičovat)
export function pickQuest(stats: Stats, rounds: Record<string, number>, log: LogLike[], today: string, practiceOk: boolean, rng: Rng = Math.random): Quest {
  if (practiceOk && rng() < .25) return { kind: 'practice', level: 'practice', need: 1, got: 0, done: false };
  const level = questLevel(stats, log, today, rng);
  if ((rounds[level] || 0) >= 2 && rng() < .35) return { kind: 'perfect', level, need: 1, got: 0, done: false };
  return { kind: 'rounds', level, need: 2, got: 0, done: false };
}

// po povedeném kole: posune úkol; vrací true, když se úkol právě splnil
export function questStep(q: Quest | null, level: string, ok: boolean, perfect: boolean): boolean {
  if (!q || q.done || !ok || level !== q.level) return false;
  if (q.kind === 'perfect' && !perfect) return false;
  q.got = Math.min(q.need, q.got + 1);
  if (q.got >= q.need) { q.done = true; return true; }
  return false;
}

// zadání slovy; name = název patra (Písmena, Mluvení…)
export function questText(q: Quest, name: string): string {
  if (q.kind === 'practice') return 'Zahraj jedno kolo Procvičit';
  if (q.kind === 'perfect') return `Zahraj jedno kolo v patře ${name} bez jediné chyby`;
  return `Zahraj dvě povedená kola v patře ${name}`;
}

export const isNewDay = (daily: Daily | null | undefined, d: Date = new Date()): boolean => !daily || daily.d !== dayStr(d);
