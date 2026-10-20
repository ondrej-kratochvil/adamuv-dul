// Převlékání rodiny (verze 28)
import { describe, expect, it } from 'vitest';
import { WEAR, SLOT_NAMES } from '../../src/content/family-wear';
import { toggleWear, wornItems, wearCount, type FamWear } from '../../src/logic/family-wear';

describe('převlékání rodiny', () => {
  it('každý kousek má jedinečné id, název pro hlas, cenu a kreslí se jen do portrétu 16 × 16', () => {
    expect(new Set(WEAR.map(w => w.id)).size).toBe(WEAR.length);
    for (const w of WEAR) {
      expect(w.acc.length, w.id).toBeGreaterThan(2);
      expect(w.price, w.id).toBeGreaterThan(0);
      expect(Object.keys(SLOT_NAMES)).toContain(w.slot);
      w.paint((x, y, ww, h) => { expect(x >= 0 && y >= 0 && x + ww <= 16 && y + h <= 16, `${w.id} ${x},${y}`).toBe(true); });
    }
  });
  it('na jednom místě jeden kousek; druhé klepnutí sundá', () => {
    const fw: FamWear = {};
    expect(toggleWear(fw, 'iva', 'cepice')).toBe(true);
    expect(toggleWear(fw, 'iva', 'koruna')).toBe(true); // nahradí čepici
    expect(toggleWear(fw, 'iva', 'klaun')).toBe(true);
    expect(fw.iva).toEqual({ head: 'koruna', nose: 'klaun' });
    expect(wornItems(fw, 'iva')).toEqual(['klaun', 'koruna']); // hlava se kreslí poslední
    expect(wearCount(fw)).toBe(2);
    expect(toggleWear(fw, 'iva', 'koruna')).toBe(false);
    expect(toggleWear(fw, 'iva', 'klaun')).toBe(false);
    expect(fw).toEqual({});
    expect(toggleWear(fw, 'iva', 'neexistuje')).toBe(false);
  });
});
