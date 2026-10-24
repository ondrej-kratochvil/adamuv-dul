// Stupně obtížnosti podle zvládnutí (Ondřej 24. 10. 2026): obsah přibývá podle toho, co Adam umí, ne podle počtu kol.
import { describe, expect, it } from 'vitest';
import { MATH_TO_20, STAGES, STAGE_SHARE, masteredStage, stageNews, stageOf } from '../../src/logic/stages';
import { MASTERY_SETS, type Stats } from '../../src/logic/mastery';
import { LETTERS, SYLL } from '../../src/content/letters';
import { WORDS } from '../../src/content/words';
import { PIC_WORDS } from '../../src/content/pictures';
import { GLYPHS } from '../../src/content/glyphs';

const good = (level: string, items: string[]): Stats => Object.fromEntries(items.map(it => [level + ':' + it, { ok: 3, miss: 0, n: 3 }]));
const finite = Object.keys(STAGES).filter(l => l !== 'math');

describe('stupně obtížnosti', () => {
  it.each(finite)('%s: každý stupeň obsahuje všechno z předchozího a přidá něco nového', level => {
    const st = STAGES[level];
    expect(st.length).toBeGreaterThanOrEqual(2);
    for (let k = 1; k < st.length; k++) {
      for (const it of st[k - 1].items) expect(st[k].items, `${level} ${k}: ${it}`).toContain(it);
      expect(st[k].items.length).toBeGreaterThan(st[k - 1].items.length);
      expect(st[k].name.length, `${level} ${k}`).toBeGreaterThan(0);
    }
  });
  it('poslední stupeň = celý obsah patra (nic se nedá zvládnout, co se neotevře)', () => {
    const last = (l: string) => [...STAGES[l][STAGES[l].length - 1].items].sort();
    expect(last('letters')).toEqual([...LETTERS].sort());
    expect(last('syllables')).toEqual([...SYLL].sort());
    expect(last('words')).toEqual([...WORDS].sort());
    expect(last('reading')).toEqual([...PIC_WORDS].sort());
    expect(last('writing')).toEqual([...MASTERY_SETS().writing].sort()); // jen zapnutá písmena (GLYPHS má celou abecedu)
    expect(last('speech')).toEqual([...MASTERY_SETS().speech].sort());
    for (const n of MASTERY_SETS().numbers) expect(last('numbers')).toContain(n);
  });
  it('první stupeň je malý: písmena jen krátké samohlásky, slabiky jen s M, mluvení jen R a L', () => {
    expect(STAGES.letters[0].items).toEqual(['A', 'E', 'I', 'O', 'U']);
    expect(STAGES.syllables[0].items).toEqual(['MA', 'ME', 'MI', 'MO', 'MU']);
    expect(STAGES.numbers.map(s => s.items.length - 1)).toEqual([10, 20, 50, 100]);
    expect(STAGES.speech).toHaveLength(5);
  });
  it('další stupeň až při 70 % zvládnutých úloh všech otevřených stupňů', () => {
    const items = STAGES.letters[0].items, need = Math.ceil(items.length * STAGE_SHARE);
    expect(masteredStage('letters', {})).toBe(0);
    expect(masteredStage('letters', good('letters', items.slice(0, need - 1)))).toBe(0);
    expect(masteredStage('letters', good('letters', items.slice(0, need)))).toBe(1);
    // všechno zvládnuté = poslední stupeň najednou (starší postup se hned zařadí podle toho, co umí)
    expect(masteredStage('letters', good('letters', LETTERS))).toBe(STAGES.letters.length - 1);
  });
  it('úloha s chybou se nepočítá jako zvládnutá', () => {
    const st: Stats = good('numbers', STAGES.numbers[0].items);
    for (const k of Object.keys(st).slice(0, 5)) st[k] = { ok: 3, miss: 2, n: 5 };
    expect(masteredStage('numbers', st)).toBe(0);
  });
  it('dosažený stupeň se nezavře, ani když úlohy přestanou být zvládnuté', () => {
    expect(stageOf('numbers', {}, { numbers: 2 })).toBe(2);
    expect(stageOf('numbers', {}, { numbers: 9 })).toBe(3); // nikdy za poslední stupeň
  });
  it('Počty: do 20 po 12 zvládnutých příkladech do 10, přechod a desítky po 10 zvládnutých v druhé desítce', () => {
    const to10 = ['1+1', '2+3', '4+5', '6+2', '7+1', '8+2', '9-3', '5-2', '6-6', '10-4', '3+4', '7-5'];
    expect(to10).toHaveLength(MATH_TO_20);
    expect(masteredStage('math', good('math', to10.slice(1)))).toBe(0);
    expect(masteredStage('math', good('math', to10))).toBe(1);
    const second = ['11+2', '12+3', '13+4', '14+5', '15+1', '16+2', '17-3', '18-4', '19-5', '15-2'];
    expect(masteredStage('math', { ...good('math', to10), ...good('math', second) })).toBe(2);
  });
  it('oznámení říká, co se otevřelo, a nic, když se nic nezměnilo', () => {
    expect(stageNews('numbers', 1, 2)).toBe('čísla do padesáti');
    expect(stageNews('letters', 0, 2)).toContain('Á');
    expect(stageNews('letters', 0, 2)).toContain('Y');
    expect(stageNews('numbers', 2, 2)).toBe('');
    expect(stageNews('speech', 0, 1)).toMatch(/^hlásky S a Š/);
  });
});
