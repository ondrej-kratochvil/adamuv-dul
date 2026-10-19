import { describe, expect, it } from 'vitest';
import { PIC_PART, PIC_WORDS, partLabel } from '../../src/content/pictures';
import { readingAfter } from '../../src/logic/tasks';

describe('obrázky, kde je slovo jen část názvu', () => {
  it('tečky ukazují chybějící kus, jedna za každé písmeno', () => {
    expect(partLabel('OSA', 'osa')).toBe('.osa'); // vosa: chybí 1 písmeno
    expect(partLabel('OSY', 'OSY')).toBe('.OSY');
    expect(partLabel('SUM', 'sum')).toBe('sum..'); // sumec: chybí 2 písmena
    expect(partLabel('LES', 'les')).toBe('les');
  });
  it('po správné odpovědi zazní celé slovo', () => {
    expect(readingAfter('OSA')).toBe('Je to vosa. Na ceduli byl jen kousek slova: osa.');
    expect(readingAfter('SUM')).toContain('sumec');
    expect(readingAfter('LES')).toBe('Je to les.');
  });
  it('celé slovo opravdu obsahuje to, co je na ceduli, na správné straně', () => {
    for (const [w, p] of Object.entries(PIC_PART)) {
      expect(PIC_WORDS).toContain(w);
      const low = w.toLocaleLowerCase('cs');
      if (p.before) expect(p.full.endsWith(low), w).toBe(true);
      if (p.after) expect(p.full.startsWith(low), w).toBe(true);
    }
  });
});
