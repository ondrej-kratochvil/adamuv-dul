// Profily hráčů (Ondřej 20. 10. 2026)
import { describe, expect, it } from 'vitest';
import { MAIN_ID, addProfile, backupKeyFor, keyFor, parseRegistry, removeProfile } from '../../src/logic/profiles';
import { seeded } from '../../src/logic/random';

describe('profily hráčů', () => {
  it('Adamův profil má původní klíč, ostatní vlastní', () => {
    expect(keyFor(MAIN_ID)).toBe('adamuv-dul-v1');
    expect(backupKeyFor(MAIN_ID)).toBe('adamuv-dul-zaloha');
    expect(keyFor('pabc')).toBe('adamuv-dul-v1:pabc');
  });
  it('chybějící nebo poškozený seznam = jen Adam; Adam v seznamu nikdy nechybí', () => {
    for (const raw of [null, '', 'x', '{"list":5}']) expect(parseRegistry(raw)).toEqual({ active: MAIN_ID, list: [{ id: MAIN_ID, name: 'Adam' }] });
    const r = parseRegistry(JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Test' }] }));
    expect(r.list.map(p => p.id)).toEqual([MAIN_ID, 'p1']);
    expect(r.active).toBe('p1');
  });
  it('přidat a smazat; Adama smazat nejde, smazaný aktivní přepne na Adama', () => {
    const r = parseRegistry(null);
    const id = addProfile(r, '  Test  ', seeded(1));
    expect(r.list.find(p => p.id === id)?.name).toBe('Test');
    r.active = id;
    expect(removeProfile(r, MAIN_ID)).toBe(false);
    expect(removeProfile(r, id)).toBe(true);
    expect(r.active).toBe(MAIN_ID);
  });
});
