// Uložený postup: žádná nová verze nesmí Adamovi nic vzít.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { defaults, exportText, importText, migrate, SCHEMA } from '../../src/save/schema';

const fixture = (n: string) => JSON.parse(readFileSync(new URL(`../fixtures/${n}.json`, import.meta.url), 'utf8'));

describe('uložený postup', () => {
  it('nesmysl nebo prázdno = výchozí stav', () => {
    for (const x of [null, undefined, 42, 'text', [], {}]) expect(migrate(x).total).toBe(0);
  });
  it('nejstarší postup: nic se neztratí, chybějící se doplní', () => {
    const old = fixture('save-nejstarsi');
    const s = migrate(old);
    expect(s.total).toBe(old.total);
    expect(s.stats).toEqual(old.stats);
    expect(s.rounds).toMatchObject({ ...old.rounds, words: 0, math: 0 });
    expect(s.streak).toEqual(defaults().streak);
    expect(s.schema).toBe(SCHEMA);
  });
  it('pokročilý postup: všechno zůstane', () => {
    const old = fixture('save-pokrocily');
    const s = migrate(old);
    for (const k of Object.keys(old)) expect(s[k], k).toEqual(old[k]);
  });
  it('neznámá budoucí pole se nezahodí', () => {
    expect(migrate({ total: 1, rounds: {}, novinka: [1, 2] }).novinka).toEqual([1, 2]);
  });
  it('převod je opakovatelný beze změny', () => {
    const once = migrate(fixture('save-pokrocily'));
    expect(migrate(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });
  it('přenos na jiný tablet: export a import', () => {
    const s = migrate(fixture('save-pokrocily'));
    expect(importText(exportText(s))).toEqual(s);
    expect(importText('  ' + exportText(s) + '\n')).toEqual(s);
    expect(importText('ahoj')).toBeNull();
    expect(importText('{"a":1}')).toBeNull();
  });
});
