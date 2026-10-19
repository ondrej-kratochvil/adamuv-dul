// Kalendář: dny jako text RRRR-MM-DD v místním čase tabletu, české svátky a roční období.
export const pad2 = (n: number): string => String(n).padStart(2, '0');
export const dayStr = (d: Date = new Date()): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
// pořadové číslo dne (rozdíl dvou dnů = počet dní mezi nimi, bez vlivu letního času)
export const dayNum = (str: string): number => { const [y, m, d] = str.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
export const dayWord = (n: number): string => n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní';

// pondělí týdne, do kterého den patří
export function weekKey(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(d - ((dt.getDay() + 6) % 7));
  return dayStr(dt);
}

// Velikonoční pondělí (gregoriánský výpočet Velikonoční neděle + 1 den)
export function easterMonday(y: number): string {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayStr(new Date(y, month - 1, day + 1));
}

export interface Holiday { id: string; text: string; all?: boolean; who?: string; gift?: number }

// české svátky a rodinná výročí (Adam *17. 6. 2020, David *4. 6. 2023)
export function holidayOn(date: Date): Holiday | null {
  const ds = dayStr(date), md = ds.slice(5);
  if (md === '06-17') return { id: 'narozeniny', all: true, gift: 20, text: 'Všechno nejlepší k narozeninám, Adame!' };
  if (md === '12-24') return { id: 'vanoce', all: true, gift: 20, text: 'Veselé Vánoce, Adame! A dnes máš i svátek, protože Adam a Eva slaví na Štědrý den.' };
  if (md === '12-05') return { id: 'mikulas', all: true, gift: 5, text: 'Dnes večer chodí Mikuláš, čert a anděl! Byl jsi hodný, tak dostáváš smaragdy.' };
  if (md === '06-01') return { id: 'den-deti', all: true, gift: 10, text: 'Šťastný Den dětí, Adame!' };
  if (md === '01-01') return { id: 'novy-rok', all: true, gift: 5, text: 'Šťastný nový rok, Adame!' };
  if (md === '06-04') return { id: 'david-narozeniny', who: 'david', text: 'Dnes má narozeniny brácha Davídek! Popřej mu všechno nejlepší.' };
  if (md === '12-30') return { id: 'david-svatek', who: 'david', text: 'Dnes má svátek brácha Davídek! Popřej mu.' };
  if (ds === easterMonday(date.getFullYear())) return { id: 'velikonoce', all: true, gift: 5, text: 'Veselé Velikonoce! Hody, hody, doprovody, dejte vejce malovaný.' };
  return null;
}

export type Season = 'xmas' | 'winter' | 'autumn' | '';
// prosinec až Tři králové = vánoční, leden a únor zima, září až listopad podzim
export function seasonOf(date: Date): Season {
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 12 || (m === 1 && d <= 6)) return 'xmas';
  if (m <= 2) return 'winter';
  if (m >= 9 && m <= 11) return 'autumn';
  return '';
}
