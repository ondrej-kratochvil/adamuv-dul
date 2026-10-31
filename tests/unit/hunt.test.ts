// Hledání pokladu s písmeny (src/logic/hunt.ts)
import { describe, expect, it } from 'vitest';
import { HUNT_BONUS, HUNT_PER_DAY, fitSize, huntDefaults, huntFound, huntLetters, pickHuntLetter } from '../../src/logic/hunt';
import { seeded } from '../../src/logic/random';

describe('poklad', () => {
  it('písmena: samohlásky a zapnuté souhlásky, žádné, na které slovo nezačíná', () => {
    expect(huntLetters(['M', 'L', 'S'])).toEqual(['A', 'E', 'I', 'O', 'U', 'M', 'L', 'S']);
    expect(huntLetters(['Ě', 'P'])).toEqual(['A', 'E', 'I', 'O', 'U', 'P']);
  });
  it('nové písmeno: ne stejné jako minule, přednost nenalezeným dnes', () => {
    const h = { d: '2026-10-31', today: ['A', 'E', 'I', 'O', 'U', 'M'], total: 6 };
    for (let s = 1; s <= 200; s++) { const l = pickHuntLetter(['M', 'L'], h, 'X', seeded(s)); expect(l).toBe('L'); }
    for (let s = 1; s <= 200; s++) expect(pickHuntLetter(['M'], huntDefaults(), 'A', seeded(s))).not.toBe('A');
  });
  it('smaragdy jen za první nález písmene dnes a nejvýš za tři poklady denně; nový den znovu', () => {
    let h = huntDefaults(), sum = 0;
    for (const l of ['M', 'M', 'A', 'E', 'O']) { const r = huntFound(h, l, '2026-10-31'); h = r.hunt; sum += r.bonus; }
    expect(sum).toBe(HUNT_BONUS * HUNT_PER_DAY);
    expect(h.total).toBe(5);
    expect(huntFound(h, 'M', '2026-11-01').bonus).toBe(HUNT_BONUS);
  });
  it('fotka se zmenší na nejvýš 640 px, malá zůstane', () => {
    expect(fitSize(4000, 3000)).toEqual({ w: 640, h: 480 });
    expect(fitSize(300, 200)).toEqual({ w: 300, h: 200 });
  });
});
