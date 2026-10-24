// Uložený postup: žádná nová verze nesmí Adamovi nic vzít.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { defaults, exportText, importText, migrate, SCHEMA } from '../../src/save/schema';

const fixture = (n: string) => JSON.parse(readFileSync(new URL(`../fixtures/${n}.json`, import.meta.url), 'utf8'));
// stará hodnota zůstane celá; u objektů smí přibýt nová pole s výchozí hodnotou (třeba počítadlo kol nového patra)
const kept = (now: unknown, was: unknown, k: string) => was && typeof was === 'object' && !Array.isArray(was) ? expect(now, k).toMatchObject(was as object) : expect(now, k).toEqual(was);

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
    for (const k of Object.keys(old)) kept(s[k], old[k], k);
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
  });
  it('postup zkopírovaný z e-mailu se zalomenými řádky jde vložit (20. 10. 2026)', () => {
    const s = defaults(); s.total = 36; s.gameName = 'Adamův důl'; s.ench = ['hat:Afinita k vodě:1'];
    const wrapped = exportText(s).replace('Adamův důl', 'Adamův\r\ndůl').replace('Afinita k vodě', 'Afinita\nk \nvodě').replace(',"total"', ',\n"total"');
    expect(importText(wrapped)).toEqual(s);
    expect(importText('{"a":1}')).toBeNull();
  });
});

describe('schéma 3 (verze hry 27): doba řešení, procvičování, tabulka Google', () => {
  it('postup ve schématu 2 (tvar jako export z Adamova tabletu 19. 10. 2026): nic se neztratí, doplní se nová pole', () => {
    const old = fixture('save-v2');
    const s = migrate(old);
    for (const k of Object.keys(old)) if (k !== 'schema') kept(s[k], old[k], k);
    expect(s.schema).toBe(SCHEMA);
    expect(s.practice).toBe(0);
    expect(s.sync).toEqual({ url: '', queue: [], last: 0, sent: 0, error: '', seq: 0, device: '', uid: '' });
  });
  it('rozbitá fronta se opraví na prázdnou, adresa zůstane', () => {
    const s = migrate({ total: 1, rounds: {}, sync: { url: 'https://script.google.com/macros/s/abc/exec', queue: 'x' } });
    expect(s.sync.queue).toEqual([]);
    expect(s.sync.url).toBe('https://script.google.com/macros/s/abc/exec');
  });
});

describe('schéma 4 (verze hry 28): převlékání rodiny', () => {
  it('starší postup dostane prázdné převlékání, nic jiného se nezmění', () => {
    const old = { ...defaults(), schema: 3, famWear: undefined, famOwned: undefined, total: 12, emeralds: 140 } as Record<string, unknown>;
    delete old.famWear; delete old.famOwned;
    const s = migrate(old);
    expect(s.famWear).toEqual({});
    expect(s.famOwned).toEqual([]);
    expect(s.emeralds).toBe(140);
    expect(s.schema).toBe(SCHEMA);
  });
  it('převlečená rodina se při převodu neztratí', () => {
    const s = migrate({ total: 1, rounds: {}, famWear: { iva: { head: 'koruna' } }, famOwned: ['koruna'] });
    expect(s.famWear).toEqual({ iva: { head: 'koruna' } });
    expect(s.famOwned).toEqual(['koruna']);
  });
});

describe('schéma 5 (verze hry 39): název zařízení pro tabulku', () => {
  it('postup ve schématu 4 s nastavenou tabulkou: adresa, fronta i počty zůstanou, přibude prázdný název a značka', () => {
    const q = [{ ID: 'a-1', Druh: 'kolo' }];
    const s = migrate({ schema: 4, total: 40, rounds: {}, sync: { url: 'https://script.google.com/macros/s/X/exec', queue: q, last: 5, sent: 120, error: '', seq: 9 } });
    expect(s.sync).toMatchObject({ url: 'https://script.google.com/macros/s/X/exec', queue: q, sent: 120, seq: 9, device: '', uid: '' });
    expect(s.schema).toBe(SCHEMA);
  });
});

describe('schéma 6 (verze hry 51): ranní karta a dnešní úkol', () => {
  it('starší postup dostane prázdný dnešní úkol (karta přijde při spuštění), nic jiného se nezmění', () => {
    const s = migrate({ schema: 5, total: 30, emeralds: 77, rounds: { speech: 2 } });
    expect(s.daily).toEqual({ d: '', quest: null, shown: false });
    expect(s).toMatchObject({ total: 30, emeralds: 77, schema: SCHEMA });
  });
  it('rozehraný dnešní úkol se při převodu neztratí', () => {
    const daily = { d: '2026-10-22', quest: { kind: 'rounds', level: 'speech', need: 2, got: 1, done: false }, shown: true };
    expect(migrate({ total: 1, rounds: {}, daily }).daily).toEqual(daily);
  });
});


describe('schéma 7 (verze hry 52): stupně obtížnosti podle zvládnutí', () => {
  it('postup ve schématu 6 (18 kol Čísel, zvládnutá čísla do 10): nic se neztratí, přibudou prázdné stupně', () => {
    const old = fixture('save-v6');
    const s = migrate(old);
    for (const k of Object.keys(old)) if (k !== 'schema') kept(s[k], old[k], k);
    expect(s.stages).toEqual({});
    expect(s.schema).toBe(SCHEMA);
  });
  it('dosažené stupně se při převodu neztratí', () => {
    expect(migrate({ schema: 7, total: 3, rounds: {}, stages: { numbers: 2, letters: 1 } }).stages).toEqual({ numbers: 2, letters: 1 });
  });
});

describe('schéma 8 (Schoolcraft, verze hry 53): hráč a písmena', () => {
  it('starší postup je Adamův: vestavěný hráč a jeho název hry', () => {
    const s = migrate({ schema: 7, total: 40, rounds: {} });
    expect(s.player).toBe('adam');
    expect(s.gameName).toBe('Adamův důl');
  });
  it('vybraný název hry se nezmění', () => {
    expect(migrate({ schema: 7, total: 1, rounds: {}, gameName: 'Adamcraft' }).gameName).toBe('Adamcraft');
  });
  it('nová hra zatím nemá hráče (úvodní nastavení) a jmenuje se Schoolcraft', () => {
    expect(defaults().player).toBeNull();
    expect(defaults().gameName).toBe('Schoolcraft');
  });
  it('postup jiného hráče si hráče ponechá', () => {
    const vita = { v: 1, name: 'Víťa', voc: 'Víťo', poss: 'Víťův', gender: 'm', family: [], friends: [] };
    expect(migrate({ schema: 8, total: 2, rounds: {}, player: vita }).player).toEqual(vita);
  });
});

describe('schéma 9 (verze hry 56): psací písmo', () => {
  it('Adam ho má zapnuté, nový hráč ne; vybrané nastavení zůstane', () => {
    expect(migrate({ schema: 8, total: 5, rounds: {}, player: 'adam' }).cursive).toBe(true);
    expect(migrate({ total: 5, rounds: {} }).cursive).toBe(true); // starý postup = Adam
    expect(migrate({ schema: 8, total: 5, rounds: {}, player: { v: 1, name: 'Víťa', voc: 'Víťo', poss: 'Víťův', gender: 'm', family: [], friends: [] } }).cursive).toBe(false);
    expect(migrate({ schema: 9, total: 5, rounds: {}, player: 'adam', cursive: false }).cursive).toBe(false);
    expect(defaults().cursive).toBe(false);
  });
});
