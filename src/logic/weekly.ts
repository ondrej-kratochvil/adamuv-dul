// Týdenní souhrn pro rodiče (Ondřej 11. 11. 2026, návrh docs/tydenni-souhrn-navrh.md): co dítě za týden zvládlo, kolik dní hrálo
// a na čem pracovat, aby ho rodič mohl konkrétně pochválit. Počítá se jen v zařízení. Týden = pondělí až neděle (čas zařízení).
import { mastery, type Stat, type Stats } from './mastery';
import { weakItems } from './practice';

export const DAY_MS = 86400000;
// datum zvládnutí: klíč úlohy (patro:úloha) → čas, kdy poprvé přešla na „zvládnuté“ (od schématu 14, starší úlohy datum nemají)
export type Got = Record<string, number>;
export function markGot(got: Got, key: string, s: Stat | undefined, now: number): boolean {
  if (got[key] || mastery(s) !== 'good') return false;
  got[key] = now;
  return true;
}

// pondělí 0:00 týdne, do kterého patří datum
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export interface LogLike { t: number; level: string; ok: boolean }
export interface NewItems { level: string; items: string[] }
export interface Weak { level: string; item: string; with?: string }
export interface WeekSummary {
  from: Date; to: Date;             // pondělí a neděle
  days: boolean[];                  // po až ne: den s aspoň jedním povedeným kolem
  daysPlayed: number;
  okRounds: number;
  topLevels: string[];              // patra s nejvíc povedenými koly (nejvýš 2)
  newCount: number;
  newItems: NewItems[];             // podle pater, v pořadí zvládnutí
  weak: Weak[];                     // nejvýš 3 nejslabší úlohy (stav teď, ne za týden)
}

export const WEEK_LEVELS = ['letters', 'syllables', 'words', 'reading', 'numbers', 'math', 'writing', 'speech'];
export function weekSummary(log: readonly LogLike[], got: Got, stats: Stats, from: Date): WeekSummary {
  const to = addDays(from, 6), end = addDays(from, 7).getTime(), start = from.getTime();
  const days = Array.from({ length: 7 }, () => false), per: Record<string, number> = {};
  let okRounds = 0;
  for (const e of log) {
    if (!e.ok || e.t < start || e.t >= end) continue;
    okRounds++; per[e.level] = (per[e.level] || 0) + 1;
    const d = new Date(e.t); // Math.round: den přes změnu času má 23 nebo 25 hodin
    days[Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start) / DAY_MS)] = true;
  }
  const topLevels = Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
  const fresh = Object.entries(got).filter(([, t]) => t >= start && t < end).sort((a, b) => a[1] - b[1]);
  const byLevel = new Map<string, string[]>();
  for (const [k] of fresh) {
    const i = k.indexOf(':'), level = k.slice(0, i), item = k.slice(i + 1);
    if (!WEEK_LEVELS.includes(level)) continue;
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level)!.push(item);
  }
  const newItems = [...byLevel].map(([level, items]) => ({ level, items }));
  const weak = weakItems(stats).slice(0, 3).map(w => {
    const s = stats[w.level + ':' + w.item], top = s && s.conf ? Object.entries(s.conf).sort((a, b) => b[1] - a[1])[0] : null;
    return top && top[1] >= 2 ? { level: w.level, item: w.item, with: top[0] } : { level: w.level, item: w.item };
  });
  return { from, to, days, daysPlayed: days.filter(Boolean).length, okRounds, topLevels, newCount: newItems.reduce((a, x) => a + x.items.length, 0), newItems, weak };
}

// rozsah týdne pro nadpis: „3. až 9. 11.“ (přes měsíc „27. 10. až 2. 11.“)
export const weekRange = (s: Pick<WeekSummary, 'from' | 'to'>): string =>
  s.from.getMonth() === s.to.getMonth() ? `${s.from.getDate()}. až ${s.to.getDate()}. ${s.to.getMonth() + 1}.` : `${s.from.getDate()}. ${s.from.getMonth() + 1}. až ${s.to.getDate()}. ${s.to.getMonth() + 1}.`;
export const dayDots = (days: readonly boolean[]): string => days.map(x => x ? '●' : '○').join('');
const dny = (n: number) => n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní';
const ukolu = (n: number) => n === 1 ? 'nový úkol' : n >= 2 && n <= 4 ? 'nové úkoly' : 'nových úkolů';

// tip pro rodiče podle nejslabší úlohy
export function parentTip(w: Weak | undefined, label: string): string {
  if (!w) return '';
  switch (w.level) {
    case 'letters': return `Zkuste spolu najít doma něco, co začíná na ${label}.`;
    case 'syllables': return `Zkuste spolu vymyslet slovo se slabikou ${label}.`;
    case 'words': case 'reading': return `Přečtěte si spolu slovo ${label}, třeba na lístečku na lednici.`;
    case 'numbers': return `Zkuste spolu najít číslo ${label} kolem sebe (autobus, kalendář, dům).`;
    case 'math': return `Spočítejte spolu ${label} na prstech nebo na kostkách.`;
    case 'writing': return `Zkuste spolu kreslit ${label} prstem na záda nebo do mouky.`;
    default: return `Zkuste spolu procvičit ${label}.`;
  }
}

// text ke sdílení rodině (WhatsApp, SMS); label(level, item) a levelName(level) dodá hra
export function shareText(s: WeekSummary, name: string, g: (m: string, f: string) => string, label: (lv: string, it: string) => string, levelName: (lv: string) => string): string {
  const lines = [`Schoolcraft, týden ${weekRange(s)}: ${name} ${g('hrál', 'hrála')} ${s.daysPlayed} ze 7 dní` + (s.newCount ? ` a ${g('zvládl', 'zvládla')} ${s.newCount} ${ukolu(s.newCount)}.` : '.')];
  if (s.newItems.length) lines.push(`Nově umí: ${s.newItems.map(x => `${levelName(x.level).toLowerCase()} ${x.items.slice(0, 6).map(it => label(x.level, it)).join(', ')}${x.items.length > 6 ? '…' : ''}`).join('; ')}.`);
  if (s.weak.length) lines.push(`Ještě se učí: ${s.weak.map(w => label(w.level, w.item) + (w.with ? ` (plete si s ${label(w.level, w.with)})` : '')).join(', ')}.`);
  return lines.join('\n');
}

// pondělní věta pro dítě o minulém týdnu (čte hlas při ranní kartě); nic, když minulý týden nehrálo
export function mondayLine(s: WeekSummary, g: (m: string, f: string) => string): string {
  const n = s.newCount, what = n ? ` a ${g('naučil ses', 'naučila ses')} ${n} ${n === 1 ? 'novou věc' : n <= 4 ? 'nové věci' : 'nových věcí'}` : '';
  if (s.daysPlayed >= 5) return `Minulý týden jsi ${g('hrál', 'hrála')} skoro každý den${what}. ${g('Jsi šampion!', 'Jsi šampionka!')}`;
  if (s.daysPlayed >= 2) return `Minulý týden jsi ${g('hrál', 'hrála')} ${s.daysPlayed} ${dny(s.daysPlayed)}${what}. Tento týden to zkusíme ještě o den víc?`;
  if (s.daysPlayed === 1) return `Minulý týden jsi ${g('hrál', 'hrála')} jeden den. Dnes můžeš začít novou řadu!`;
  return '';
}
