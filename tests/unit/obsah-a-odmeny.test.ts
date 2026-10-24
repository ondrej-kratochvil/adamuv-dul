// Pravidla, která musí platit pro obsah a odměny i po každém budoucím rozšíření hry.
import { MORE_WORDS } from '../../src/content/alphabet';
import { describe, expect, it } from 'vitest';
import { LETTERS, SAY_LETTER, SYLL } from '../../src/content/letters';
import { NAMES, WORDS } from '../../src/content/words';
import { PIC, PIC_WORDS, PLURAL } from '../../src/content/pictures';
import { GLYPHS } from '../../src/content/glyphs';
import { ENCH_ORDER } from '../../src/content/enchants';
import { WRITING_ALL } from '../../src/logic/tasks';
import { BUILDING_STAGES, EYES, buildingStage, eyesFor, errorCost, errorWarning, MAX_ERROR_LOSS, newEnchants, rareLeft, rareNeed, stuckMsFor } from '../../src/logic/rewards';
import { masteryPoints } from '../../src/logic/mastery';

const KNOWN = new Set(LETTERS);

describe('obsah', () => {
  it('slova jen z písmen, která Adam zná', () => {
    for (const w of WORDS) for (const ch of w) expect(KNOWN.has(ch), `${w}: ${ch}`).toBe(true);
  });
  it('slova se neopakují, jména jsou mezi slovy', () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const n of NAMES) expect([...WORDS, ...MORE_WORDS]).toContain(n); // jména z dalších písmen (PEPA, TOM) jsou v content/alphabet.ts
  });
  it('každé písmeno umí hlas říct', () => {
    for (const l of LETTERS) expect(SAY_LETTER[l]).toBeTruthy();
  });
  it('slabiky jsou z písmen hry', () => {
    for (const s of SYLL) for (const ch of s) expect(KNOWN.has(ch)).toBe(true);
  });
  it('každé slovo ke čtení je mezi slovy a má obrázek', () => {
    for (const w of PIC_WORDS) { expect(WORDS).toContain(w); expect(PIC[PLURAL[w] || w]).toBeTypeOf('function'); }
  });
  it('každý úkol psaní má tahy', () => {
    for (const k of WRITING_ALL) expect(GLYPHS[k]?.length, k).toBeGreaterThan(0);
  });
});

describe('odměny: maximum až po zvládnutí všeho', () => {
  const max = masteryPoints({}).max;
  it('se vším zvládnutým má Adam všechna očarování', () => {
    expect(newEnchants(max, max, [])).toHaveLength(ENCH_ORDER.length);
  });
  it('s jediným nezvládnutým úkolem ne všechna', () => {
    expect(newEnchants(max - 1, max, []).length).toBeLessThan(ENCH_ORDER.length);
  });
  it('bez zvládnutých úkolů žádné', () => {
    expect(newEnchants(0, max, [])).toHaveLength(0);
  });
  it('odměny přibývají rovnoměrně (žádné dlouhé čekání)', () => {
    const step = max / ENCH_ORDER.length;
    expect(step).toBeLessThanOrEqual(4);
  });
  it('budova hotová jen při 100 %, oči Enderu všechny jen při 100 %', () => {
    expect(buildingStage(15, 16)).toBe(BUILDING_STAGES - 1);
    expect(buildingStage(16, 16)).toBe(BUILDING_STAGES);
    expect(eyesFor(max - 1, max)).toBeLessThan(EYES);
    expect(eyesFor(max, max)).toBe(EYES);
  });
  it('Ochrana zkracuje zaseknutí nejvýš na 1,2 s', () => {
    expect(stuckMsFor(0)).toBe(2000);
    expect(stuckMsFor(16)).toBe(1200);
    expect(stuckMsFor(99)).toBe(1200);
  });
});

describe('vzácné věci v obchodě', () => {
  it('odemknou se podílem zvládnutých úkolů, při 100 % všechny', () => {
    expect(rareNeed(.15, 177)).toBe(27);
    expect(rareLeft(.15, 20, 177)).toBe(7);
    expect(rareLeft(.75, 177, 177)).toBe(0);
    expect(rareLeft(.3, 500, 177)).toBe(0);
  });
});

describe('ztráta smaragdů za chyby (Ondřej 20. 10. 2026)', () => {
  it('první dvě chyby zdarma, po druhé varování, pak 1 smaragd za chybu', () => {
    expect([1, 2].map(e => errorCost(e, 0, 50))).toEqual([0, 0]);
    expect(errorWarning(2)).toBe(true);
    expect(errorCost(3, 0, 50)).toBe(1);
    expect(errorCost(9, 4, 50)).toBe(1);
  });
  it('nejvýš 5 za kolo a nikdy pod nulu', () => {
    expect(errorCost(20, MAX_ERROR_LOSS, 50)).toBe(0);
    expect(errorCost(3, 0, 0)).toBe(0);
  });
});

