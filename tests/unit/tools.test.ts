import { describe, expect, it } from 'vitest';
import { MATERIALS, TOOLS, toolName } from '../../src/content/tools';
import { toolNeed, toolProgress, toolStage, updateTools } from '../../src/logic/tools';
import { MASTERY_SETS, type Stats } from '../../src/logic/mastery';

const good = { ok: 3, miss: 0, n: 3 };
const masterAll = (levels: string[]): Stats => {
  const s: Stats = {};
  for (const lv of levels) {
    if (lv === 'math') for (let i = 0; i < 30; i++) s[`math:${i}+0`] = good;
    else for (const it of MASTERY_SETS()[lv]) s[`${lv}:${it}`] = good;
    if (lv === 'numbers') for (let n = 21; n <= 45; n++) if (n % 10) s['numbers:' + n] = good;
  }
  return s;
};

describe('nástroje', () => {
  it('bez zvládnutých úkolů jen dřevo, se vším netherit', () => {
    for (const t of TOOLS) {
      expect(toolStage({}, t)).toBe(0);
      expect(toolStage(masterAll(t.levels), t)).toBe(MATERIALS.length - 1);
    }
  });
  it('netherit až při všech zvládnutých úkolech jeho pater', () => {
    const t = TOOLS.find(x => x.id === 'axe')!;
    const s = masterAll(t.levels); delete s['writing:1'];
    expect(toolStage(s, t)).toBe(MATERIALS.length - 2);
    expect(toolNeed(s, t, MATERIALS.length - 2)).toBe(1);
  });
  it('dosažený materiál se nebere, i když přibudou chyby', () => {
    const t = TOOLS[0], stages: Record<string, number> = {};
    expect(updateTools(masterAll(t.levels), stages).some(n => n.tool.id === t.id)).toBe(true);
    expect(stages[t.id]).toBe(5);
    expect(updateTools({}, stages)).toEqual([]);
    expect(stages[t.id]).toBe(5);
  });
  it('každé patro patří aspoň k jednomu nástroji (krumpáč jde za kola)', () => {
    const covered = new Set(TOOLS.flatMap(t => t.levels));
    for (const lv of ['letters', 'syllables', 'words', 'reading', 'numbers', 'math', 'writing']) expect(covered.has(lv), lv).toBe(true);
    for (const t of TOOLS) expect(toolProgress({}, t).all).toBeGreaterThan(0);
  });
  it('názvy podle rodu', () => {
    expect(toolName(TOOLS.find(t => t.id === 'sword')!, 4)).toBe('diamantový meč');
    expect(toolName(TOOLS.find(t => t.id === 'hoe')!, 3)).toBe('zlatá motyka');
  });
  it('mapy nástrojů mají 16 × 16', () => {
    for (const t of TOOLS) { expect(t.map).toHaveLength(16); for (const r of t.map) expect(r).toHaveLength(16); }
  });
});
