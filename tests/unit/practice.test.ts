// Procvičování a doba řešení (verze 27, Ondřej 20. 10. 2026: „kolik času strávil u které úlohy, abychom ji mohli opakovat“)
import { describe, expect, it } from 'vitest';
import { avgSecs, recordResult, TASK_MS_MAX, type Stats } from '../../src/logic/mastery';
import { confusions, pickPractice, quickWrongShare, slowItems, weakItems } from '../../src/logic/practice';
import { genPracticeTask, type Ctx } from '../../src/logic/tasks';
import { seeded } from '../../src/logic/random';

const ctx = (rounds: Record<string, number> = {}): Ctx => ({ rounds, stats: {}, recent: [], rng: seeded(3) });

describe('doba řešení a záměny', () => {
  it('ukládá klouzavý průměr doby, záměny a tipy', () => {
    const st: Stats = {};
    recordResult(st, 'reading:MÍSA', false, { ms: 8000, wrong: ['MASO'], quick: 1 });
    recordResult(st, 'reading:MÍSA', false, { ms: 4000, wrong: ['MASO', 'OSA'] });
    const s = st['reading:MÍSA'];
    expect(s.conf).toEqual({ MASO: 2, OSA: 1 });
    expect(s.qw).toBe(1);
    expect(s.tn).toBe(2);
    expect(avgSecs(s)).toBeCloseTo(6.4); // 8 s, pak 0,6 × 8 + 0,4 × 4
  });
  it('odchod od tabletu se do doby počítá nejvýš minutou', () => {
    const st: Stats = {};
    recordResult(st, 'numbers:5', true, { ms: 10 * 60000 });
    expect(st['numbers:5'].t).toBe(TASK_MS_MAX);
  });
  it('bez údajů o době funguje jako dřív', () => {
    const st: Stats = {};
    recordResult(st, 'letters:A', true);
    expect(st['letters:A']).toEqual({ ok: 1, miss: 0, n: 1 });
  });
});

describe('výběr úloh k procvičení', () => {
  const st: Stats = {
    'reading:MÍSA': { ok: 2, miss: 3, bad: 5, n: 7, conf: { MASO: 4 }, t: 9000, tn: 5, qw: 2 },
    'syllables:LÍ': { ok: 2, miss: 0, bad: 2, n: 4, t: 7000, tn: 3 },
    'syllables:MA': { ok: 5, miss: 0, n: 5, t: 2000, tn: 5 },
    'syllables:ME': { ok: 3, miss: 0, n: 3, t: 2500, tn: 3 },
    'syllables:LA': { ok: 3, miss: 0, n: 3, t: 2200, tn: 3 },
    'letters:A': { ok: 6, miss: 0, n: 6 },
    'writing:smycka': { ok: 0, miss: 2, bad: 2, n: 2 },
  };
  it('chyby, záměny i dlouhé přemýšlení; zvládnuté a psaní ne', () => {
    const w = weakItems(st);
    expect(w.map(x => x.level + ':' + x.item)).toEqual(['reading:MÍSA', 'syllables:LÍ']);
    expect(w[0].why).toEqual(['chyby', 'plete si s MASO']); // jediná změřená úloha ve Čtení: není s čím srovnat, pomalá není
    expect(w[1].why).toEqual(['dlouho přemýšlí']);
  });
  it('nejpomalejší úlohy, záměny a podíl tipů', () => {
    expect(slowItems(st, 'syllables', 2)).toEqual([{ item: 'LÍ', secs: 7 }, { item: 'ME', secs: 2.5 }]);
    expect(confusions(st, 'reading')).toEqual([{ item: 'MÍSA', with: 'MASO', count: 4 }]);
    expect(quickWrongShare(st, 'reading')).toBeCloseTo(.4);
    expect(quickWrongShare(st, 'numbers')).toBeNull();
  });
  it('stejná úloha nejde dvakrát po sobě, když je z čeho vybírat', () => {
    const w = weakItems(st);
    for (let s = 1; s < 50; s++) expect(pickPractice(w, ['reading:MÍSA'], seeded(s))!.item).toBe('LÍ');
    expect(pickPractice([], [])).toBeNull();
  });
});

describe('úkol pro danou úlohu', () => {
  it('každé patro dá úkol se zadanou správnou odpovědí', () => {
    const cases: [string, string, string][] = [['letters', 'Ů', 'letters:Ů'], ['syllables', 'LÍ', 'syllables:LÍ'], ['words', 'SLÁMA', 'words:SLÁMA'],
      ['reading', 'MÍSY', 'reading:MÍSY'], ['numbers', '68', 'numbers:68'], ['math', '8-2', 'math:8-2'], ['math', '40+30', 'math:40+30']];
    for (const [lv, it, stat] of cases) {
      const t = genPracticeTask(lv, it, ctx());
      expect(t.stat).toBe(stat);
      expect(t.choices).toContain(t.answer);
      expect(new Set(t.choices).size).toBe(t.choices.length);
      expect(t.choices.length).toBeGreaterThanOrEqual(2);
    }
    expect(genPracticeTask('math', '8-2', ctx()).answer).toBe('6');
    expect(genPracticeTask('math', '40+30', ctx()).answer).toBe('70');
    expect(genPracticeTask('numbers', '68', ctx()).answer).toBe('68');
  });
});
