import { describe, expect, it } from 'vitest';
import { petForQuest, questsLeft, unlockedPets } from '../../src/logic/pets';
import { ADAM } from '../../src/content/player-adam';
import { normalizePlayer } from '../../src/logic/player';
import { PET_ART, PET_KINDS } from '../../src/content/pets';
import { migrate, defaults } from '../../src/save/schema';

describe('zvířátka rodiny (odemykání za splněné dnešní úkoly)', () => {
  it('na začátku žádné, pak jedno za každý splněný úkol v pořadí', () => {
    expect(unlockedPets(ADAM, 0)).toEqual([]);
    expect(petForQuest(ADAM, 1)!.name).toBe('Sunny');
    expect(unlockedPets(ADAM, 3).map(p => p.name)).toEqual(['Sunny', 'Žofinka', 'bílé myšky']);
    expect(petForQuest(ADAM, ADAM.pets!.length + 1)).toBeNull();
    expect(questsLeft(4, 2)).toBe(3);
  });
  it('Adamova zvířátka: majitelé jsou v rodině, každý druh má obrázek', () => {
    const ids = new Set(ADAM.family.map(f => f.id));
    for (const p of ADAM.pets!) {
      expect(p.owner === 'home' || ids.has(p.owner), p.id).toBe(true);
      expect(PET_KINDS).toContain(p.kind);
      expect(PET_ART[p.kind]).toBeTypeOf('function');
    }
    expect(ADAM.pets!.map(p => p.name)).toEqual(['Sunny', 'Žofinka', 'bílé myšky', 'Mourek', 'Argo', 'Karel', 'skaláry', 'Mazlík', 'Shadow', 'Harry', 'Marv']);
  });
  it('soubor hráče: zvířátka projdou, neznámý druh a zlá barva se zahodí', () => {
    const p = normalizePlayer({ name: 'Víťa', pets: [{ id: 'h', name: 'Harry', kind: 'hamster', owner: 'home', color: '#123456' }, { id: 'x', name: 'Drak', kind: 'dragon' }, { id: 'm', name: 'Marv', kind: 'hamster', color: 'red' }] })!;
    expect(p.pets!.map(x => x.name)).toEqual(['Harry', 'Marv']);
    expect(p.pets![0].color).toBe('#123456');
    expect(p.pets![1].color).toBeUndefined();
  });
  it('uložený postup: počet splněných úkolů začíná na nule a zůstane', () => {
    expect(defaults().questsDone).toBe(0);
    expect(migrate({ schema: 9, total: 3, rounds: {} }).questsDone).toBe(0);
    expect(migrate({ schema: 10, total: 3, rounds: {}, questsDone: 4 }).questsDone).toBe(4);
  });
});

import { ownedCount, wearAction, wornCount } from '../../src/logic/family-wear';
describe('více kusů stejné věci v Rodině (Ondřej 25. 10. 2026)', () => {
  it('jeden kus: nasadit, sundat a dát jinému; druhému zároveň až po koupi dalšího kusu', () => {
    const fw: Record<string, Record<string, string>> = {}, owned = ['slunecni'];
    expect(wearAction(fw, owned, 'iva', 'slunecni', 14)).toBe('on');
    fw.iva = { eyes: 'slunecni' };
    expect(wearAction(fw, owned, 'bob', 'slunecni', 14)).toBe('buyMore');
    expect(wearAction(fw, owned, 'iva', 'slunecni', 14)).toBe('off');
    delete fw.iva;
    expect(wearAction(fw, owned, 'bob', 'slunecni', 14)).toBe('on'); // sundaná věc jde dát jinému
    expect(wearAction(fw, [], 'bob', 'slunecni', 14)).toBe('buy');
  });
  it('dřív rozdaná věc víckrát zůstane, ale po sundání se musí dokoupit', () => {
    const fw: Record<string, Record<string, string>> = { iva: { eyes: 'slunecni' }, bob: { eyes: 'slunecni' }, ruda: { eyes: 'slunecni' } };
    const owned = ['slunecni'];
    expect(wornCount(fw, 'slunecni')).toBe(3);
    delete fw.ruda;
    expect(wearAction(fw, owned, 'ruda', 'slunecni', 14)).toBe('buyMore');
    expect(ownedCount(['a', 'b', 'a'], 'a')).toBe(2);
  });
  it('nejvýš tolik kusů, kolik je členů rodiny', () => {
    const fw = { a: { eyes: 'x' }, b: { eyes: 'x' } };
    expect(wearAction(fw, ['x', 'x'], 'c', 'x', 2)).toBe('max');
  });
});

import { shiftWear, WEAR_SHIFT } from '../../src/content/pets';
import { WEAR } from '../../src/content/family-wear';
describe('věci na zvířátkách (review 25. 10. 2026)', () => {
  it('žádná věc nevyjede nad obrázek, u žádného zvířátka', () => {
    for (const kind of Object.keys(WEAR_SHIFT) as (keyof typeof WEAR_SHIFT)[]) {
      if (!WEAR_SHIFT[kind]) continue;
      for (const w of WEAR) {
        const ys: number[] = [];
        shiftWear(w.paint, kind, (x, y) => ys.push(y));
        expect(Math.min(...ys), `${kind} ${w.id}`).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
