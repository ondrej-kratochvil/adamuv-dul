import { describe, expect, it } from 'vitest';
import { dayDots, markGot, mondayLine, parentTip, shareText, weekRange, weekStart, weekSummary, type Got } from '../../src/logic/weekly';
import { sundayText } from '../../src/logic/push';
import type { Stats } from '../../src/logic/mastery';

const at = (d: number, h = 17) => new Date(2026, 10, d, h).getTime(); // listopad 2026
const g = (m: string, f: string) => m, gf = (m: string, f: string) => f;
const label = (_lv: string, it: string) => it, name = (lv: string) => ({ letters: 'Písmena', words: 'Slova', math: 'Počty' } as Record<string, string>)[lv] || lv;

describe('týdenní souhrn (logic/weekly.ts)', () => {
  it('datum zvládnutí se zapíše jen jednou, při prvním „zvládnuté“', () => {
    const got: Got = {};
    expect(markGot(got, 'letters:A', { ok: 2, miss: 0 }, 1)).toBe(false);
    expect(markGot(got, 'letters:A', { ok: 3, miss: 0 }, 5)).toBe(true);
    expect(markGot(got, 'letters:A', { ok: 4, miss: 0 }, 9)).toBe(false);
    expect(got).toEqual({ 'letters:A': 5 });
  });
  it('týden začíná pondělím (neděle patří k předchozímu pondělí)', () => {
    expect(weekStart(new Date(2026, 10, 15, 20)).getDate()).toBe(9); // neděle 15. 11.
    expect(weekStart(new Date(2026, 10, 9, 0, 1)).getDate()).toBe(9);
    expect(weekStart(new Date(2026, 10, 2, 8)).getMonth()).toBe(10);
    expect(weekRange({ from: new Date(2026, 9, 26), to: new Date(2026, 10, 1) })).toBe('26. 10. až 1. 11.');
    expect(weekRange({ from: new Date(2026, 10, 9), to: new Date(2026, 10, 15) })).toBe('9. až 15. 11.');
  });
  it('dny hraní, povedená kola, nově zvládnuté po patrech; mimo týden a hodnocení výslovnosti se nepočítá', () => {
    const log = [
      { t: at(9), level: 'letters', ok: true }, { t: at(9, 18), level: 'letters', ok: true }, { t: at(11), level: 'words', ok: true },
      { t: at(12), level: 'math', ok: false }, { t: at(16), level: 'letters', ok: true }, { t: at(8), level: 'letters', ok: true },
    ];
    const got: Got = { 'letters:Ř': at(10), 'words:MÁMA': at(11), 'letters:Š': at(12), 'say:rak': at(12), 'letters:A': at(3) };
    const s = weekSummary(log, got, {}, new Date(2026, 10, 9));
    expect(s.days).toEqual([true, false, true, false, false, false, false]);
    expect(dayDots(s.days)).toBe('●○●○○○○');
    expect(s.okRounds).toBe(3);
    expect(s.topLevels).toEqual(['letters', 'words']);
    expect(s.newItems).toEqual([{ level: 'letters', items: ['Ř', 'Š'] }, { level: 'words', items: ['MÁMA'] }]);
    expect(s.newCount).toBe(3);
  });
  it('na čem pracovat: nejslabší úlohy se záměnou', () => {
    const stats: Stats = { 'letters:B': { ok: 1, miss: 3, conf: { D: 3 } }, 'letters:M': { ok: 5, miss: 0 } };
    const s = weekSummary([], {}, stats, new Date(2026, 10, 9));
    expect(s.weak[0]).toEqual({ level: 'letters', item: 'B', with: 'D' });
    expect(parentTip(s.weak[0], 'B')).toContain('na B');
  });
  it('text pro rodinu', () => {
    const s = weekSummary([{ t: at(10), level: 'letters', ok: true }], { 'letters:Ř': at(10) }, { 'letters:B': { ok: 0, miss: 2 } }, new Date(2026, 10, 9));
    const t = shareText(s, 'Adam', g, label, name);
    expect(t).toContain('Schoolcraft, týden 9. až 15. 11.: Adam hrál 1 ze 7 dní a zvládl 1 nový úkol.');
    expect(t).toContain('Nově umí: písmena Ř.');
    expect(t).toContain('Ještě se učí: B.');
    expect(shareText(s, 'Terka', gf, label, name)).toContain('Terka hrála 1 ze 7 dní a zvládla');
  });
  it('pondělní věta podle počtu dní, v rodu hráče; bez hraní nic', () => {
    const days = (n: number) => ({ ...weekSummary([], {}, {}, new Date(2026, 10, 9)), daysPlayed: n, newCount: 4 });
    expect(mondayLine(days(6), g)).toBe('Minulý týden jsi hrál skoro každý den a naučil ses 4 nové věci. Jsi šampion!');
    expect(mondayLine(days(3), gf)).toBe('Minulý týden jsi hrála 3 dny a naučila ses 4 nové věci. Tento týden to zkusíme ještě o den víc?');
    expect(mondayLine(days(1), g)).toBe('Minulý týden jsi hrál jeden den. Dnes můžeš začít novou řadu!');
    expect(mondayLine(days(0), g)).toBe('');
  });
  it('nedělní upozornění pro rodiče', () => {
    expect(sundayText('Terka', gf).body).toBe('Souhrn týdne je připravený. Podívejte se, co se Terka naučila: nastavení, Týden.');
  });
});
