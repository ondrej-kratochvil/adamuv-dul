import { afterEach, describe, expect, it } from 'vitest';
import { applyLetters, cursiveFor, lettersOf, wordFits } from '../../src/logic/letters';
import { genReading, genSentence, sentences, sentenceSay, writingSay } from '../../src/logic/tasks';
import { PIC } from '../../src/content/pictures';
import { GLYPHS, WRITING_ITEMS } from '../../src/content/glyphs';
import { seeded } from '../../src/logic/random';

afterEach(() => applyLetters(['M', 'L', 'S']));

describe('věty v Čtení (jako ve slabikáři ALTER)', () => {
  it('jen z písmen, která dítě zná; obrázek je mezi otevřenými', () => {
    const known = new Set(['M', 'L', 'S']);
    const list = sentences(known, ['MÍSA', 'MASO', 'SŮL', 'LAMA']);
    expect(list.map(x => x.text)).toEqual(expect.arrayContaining(['EMA MÁ MÍSU.', 'MÁME SŮL.', 'OLA SOLÍ MASO.']));
    for (const x of list) {
      for (const w of x.text.slice(0, -1).split(' ')) expect(wordFits(w, known), x.text).toBe(true);
      expect(['MÍSA', 'MASO', 'SŮL', 'LAMA']).toContain(x.pic);
    }
    expect(list.some(x => x.text.includes('PEPA'))).toBe(false);
  });
  it('s P přibudou PEPA MÁ PILU, MÁME MAPU…', () => {
    const list = sentences(new Set(['M', 'L', 'S', 'P']), ['PILA', 'MAPA', 'PES']).map(x => x.text);
    expect(list).toEqual(expect.arrayContaining(['PEPA MÁ PILU.', 'MÁME MAPU.', 'EMA MÁ PSA.', 'PEPA LEPÍ MAPU.']));
  });
  it('úkol: odpověď je obrázek věty a je mezi kostkami; hlas větu řekne malými se jmény velkými', () => {
    applyLetters(['M', 'L', 'S', 'P']);
    let n = 0;
    for (let s = 1; s <= 300; s++) {
      const t = genReading({ rounds: { reading: 5 }, stats: {}, recent: [], rng: seeded(s), stages: { reading: 1 } });
      if (!t.sentence) continue;
      n++;
      expect(PIC[t.answer]).toBeTruthy();
      expect(t.choices).toContain(t.answer);
      expect(t.picture).toBe(true);
    }
    expect(n).toBeGreaterThan(50);
    expect(sentenceSay('PEPA MÁ PILU.')).toBe('Pepa má pilu.');
    expect(sentenceSay('MÁME SŮL.')).toBe('Máme sůl.');
    expect(sentenceSay('MÁMA MÁ LAMU.')).toBe('Máma má lamu.');
  });
  it('v prvních kolech a v nejnižším stupni věty nejsou', () => {
    for (let s = 1; s <= 100; s++) {
      expect(genReading({ rounds: { reading: 1 }, stats: {}, recent: [], rng: seeded(s), stages: { reading: 1 } }).sentence).toBeUndefined();
      expect(genReading({ rounds: { reading: 9 }, stats: {}, recent: [], rng: seeded(s), stages: { reading: 0 } }).sentence).toBeUndefined();
    }
    expect(genSentence).toBeTypeOf('function');
  });
});

describe('psací písmo (Písanka II)', () => {
  it('vypnuté: žádná psací písmena; zapnuté: samohlásky a zapnuté souhlásky', () => {
    applyLetters(['M', 'L', 'S', 'P']);
    expect(WRITING_ITEMS.some(x => x.startsWith('c-'))).toBe(false);
    applyLetters(['M', 'L', 'S', 'P'], true);
    expect(WRITING_ITEMS.filter(x => x.startsWith('c-'))).toEqual(['c-e', 'c-i', 'c-u', 'c-ů', 'c-l', 'c-p', 'c-m', 'c-a', 'c-o']);
    expect(cursiveFor(['M', 'L', 'S', 'P', 'T', 'J', 'N'])).toContain('c-n');
  });
  it('každé psací písmeno má tahy a hlas ho řekne', () => {
    for (const k of cursiveFor(['M', 'L', 'P', 'T', 'J', 'N'])) {
      expect(GLYPHS[k], k).toBeTruthy();
      expect(writingSay(k)).toMatch(/^Napiš psací /);
    }
    expect(writingSay('c-l')).toBe('Napiš psací el.');
    expect(writingSay('c-ů')).toBe('Napiš psací ů s kroužkem.');
    expect(lettersOf('CHATA')[0]).toBe('CH');
  });
});
