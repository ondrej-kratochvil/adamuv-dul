import { describe, expect, it } from 'vitest';
import { PAIRS, SOUNDS, SPEECH_WORDS, EXERCISES } from '../../src/content/speech';
import { fitsPair, genHear, genSay, pairsFor, roundPlan } from '../../src/logic/speech';
import { seeded } from '../../src/logic/random';

describe('Mluvení', () => {
  it('každé slovo patří aspoň k jedné dvojici a nemá v sobě tu druhou hlásku', () => {
    for (const w of SPEECH_WORDS) expect(PAIRS.some(p => fitsPair(w, p)), w.w).toBe(true);
  });
  it('každá hláska z dvojic má obrázek a aspoň 4 slova', () => {
    for (const s of new Set(PAIRS.flat())) {
      expect(SOUNDS[s]).toBeTruthy();
      expect(SPEECH_WORDS.filter(w => w.s === s).length, s).toBeGreaterThanOrEqual(4);
    }
  });
  it('kolo: 5× sluch, 2× vyslovit, 1× cvik nebo foukání', () => {
    for (const r of [0, 1]) {
      const p = roundPlan(r);
      expect(p).toHaveLength(8);
      expect(p.filter(k => k === 'hear')).toHaveLength(5);
      expect(p.filter(k => k === 'say')).toHaveLength(2);
    }
    expect(roundPlan(0)).toContain('gym');
    expect(roundPlan(1)).toContain('blow');
  });
  it('sluch: správná hláska je mezi dvěma kostkami a slovo ji opravdu obsahuje', () => {
    for (const r of [0, 5]) for (let s = 1; s <= 300; s++) {
      const t = genHear(r, {}, [], seeded(s));
      expect(t.choices).toHaveLength(2);
      expect(t.choices).toContain(t.answer);
      expect(t.say.toLocaleLowerCase('cs')).toContain(t.answer.toLocaleLowerCase('cs'));
      const other = t.choices.find(c => c !== t.answer)!;
      expect(t.say.toLocaleLowerCase('cs')).not.toContain(other.toLocaleLowerCase('cs'));
      if (r < 2) expect(t.choices.sort()).toEqual(['L', 'R']);
    }
  });
  it('vyslovování jen slova s cvičenými hláskami', () => {
    const sounds = new Set(pairsFor(0).flat());
    for (let s = 1; s <= 100; s++) expect(sounds.has(genSay(0, [], seeded(s)).s)).toBe(true);
  });
  it('cviků je dost', () => { expect(EXERCISES.length).toBeGreaterThanOrEqual(6); });
});
