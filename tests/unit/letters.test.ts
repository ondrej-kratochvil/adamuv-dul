import { afterEach, describe, expect, it } from 'vitest';
import { applyLetters, lettersOf, normalizeLetters, syllablesFor, wordFits } from '../../src/logic/letters';
import { LETTERS, SYLL, CONS, SAY_LETTER, sylC, sylV } from '../../src/content/letters';
import { WORDS, BASE_WORDS } from '../../src/content/words';
import { GLYPHS, WRITING_ITEMS } from '../../src/content/glyphs';
import { CONS_ORDER, MORE_WORDS } from '../../src/content/alphabet';
import { PIC_WORDS } from '../../src/content/pictures';
import { conflict, partnerOf } from '../../src/logic/tasks';

afterEach(() => applyLetters(['M', 'L', 'S'])); // ostatní testy počítají s původními písmeny

describe('písmena zapnutá rodičem', () => {
  it('výchozí M, L, S dá stejný obsah jako dřív', () => {
    applyLetters(['M', 'L', 'S']);
    expect(LETTERS.length).toBe(16);
    expect(SYLL.length).toBe(30);
    expect(WORDS).toEqual(BASE_WORDS);
    expect(WRITING_ITEMS).toEqual([...'0123456789', ...'AEIOUYMLS', 'vlnka', 'cikcak', 'kopecky', 'smycka', 'spirala']);
  });
  it('s P přibudou písmeno, slabiky, slova a psaní; slova jen ze známých písmen', () => {
    applyLetters(['M', 'L', 'S', 'P']);
    expect(LETTERS).toContain('P');
    expect(SYLL).toContain('PA');
    expect(WORDS).toEqual(expect.arrayContaining(['PES', 'MAPA', 'LUPA', 'MÁMA']));
    expect(WORDS).not.toContain('TÁTA');
    expect(WRITING_ITEMS).toContain('P');
    for (const w of WORDS) expect(wordFits(w, new Set(CONS)), w).toBe(true);
  });
  it('výběr se srovná do pořadí slabikáře, nesmysly zmizí, prázdný = M, L, S', () => {
    expect(normalizeLetters(['P', 'M', 'XX', 'L'])).toEqual(['M', 'L', 'P']);
    expect(normalizeLetters([])).toEqual(['M', 'L', 'S']);
    expect(normalizeLetters(null)).toEqual(['M', 'L', 'S']);
  });
  it('slabiky: po měkkých bez y, po tvrdých bez i, Ě jen po b p v m d t n', () => {
    const s = syllablesFor(['J', 'K', 'D', 'Ě']);
    expect(s).toContain('JI'); expect(s).not.toContain('JY');
    expect(s).toContain('KY'); expect(s).not.toContain('KI');
    expect(s).toContain('DĚ'); expect(s).not.toContain('JĚ');
    expect(s.filter(x => x.startsWith('Ě'))).toEqual([]);
  });
  it('CH je jedno písmeno: slovo, slabika, dvojice', () => {
    expect(lettersOf('CHATA')).toEqual(['CH', 'A', 'T', 'A']);
    expect(sylC('CHA')).toBe('CH'); expect(sylV('CHÁ')).toBe('Á');
    expect(partnerOf('syllables', 'CHA')).toBe('CHÁ');
    expect(conflict('syllables', 'CHI', 'CHY')).toBe(true);
  });
  it('každé písmeno abecedy má výslovnost a (kromě CH) tahy pro psaní; všechna slova se dají přečíst s celou abecedou', () => {
    for (const c of CONS_ORDER) {
      expect(SAY_LETTER[c], c).toBeTruthy();
      if (c !== 'CH') expect(GLYPHS[c], c).toBeTruthy();
    }
    const all = new Set(CONS_ORDER);
    for (const w of MORE_WORDS) expect(wordFits(w, all), w).toBe(true);
    expect(new Set(MORE_WORDS).size).toBe(MORE_WORDS.length); // bez dvojic
  });
  it('obrázky v Čtení jen ze známých písmen', () => {
    applyLetters(['M', 'L', 'S']);
    for (const w of PIC_WORDS) expect(wordFits(w, new Set(['M', 'L', 'S'])), w).toBe(true);
  });
});
