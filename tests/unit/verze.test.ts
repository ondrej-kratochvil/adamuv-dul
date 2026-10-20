// Každá nová verze hry má záznam novinek pro Adama (pravidlo z CLAUDE.md).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { notesBetween } from '../../src/logic/version';

const root = new URL('../../', import.meta.url);
const versionJson = JSON.parse(readFileSync(new URL('public/version.json', root), 'utf8'));
const appVersion = Number(readFileSync(new URL('src/app/version.js', root), 'utf8').match(/APP_VERSION = (\d+)/)![1]);

describe('verze', () => {
  it('version.json odpovídá verzi ve hře', () => {
    expect(versionJson.version).toBe(appVersion);
    expect(versionJson.changes[0].version).toBe(appVersion);
  });
  it('každá verze má 1 až 3 krátké věty novinek', () => {
    for (const c of versionJson.changes) {
      expect(c.notes.length).toBeGreaterThanOrEqual(1);
      expect(c.notes.length).toBeLessThanOrEqual(3);
    }
  });
  it('verze jdou za sebou bez děr', () => {
    const v = versionJson.changes.map((c: { version: number }) => c.version);
    v.forEach((x: number, i: number) => i && expect(v[i - 1] - x).toBe(1));
  });
});

describe('novinky z více verzí', () => {
  it('se ukazují od nejstarší (Ondřej 20. 10. 2026)', () => {
    const ch = [{ version: 3, notes: ['c'] }, { version: 2, notes: ['b1', 'b2'] }, { version: 1, notes: ['a'] }];
    expect(notesBetween(ch, 1, 3)).toEqual(['b1', 'b2', 'c']);
    expect(notesBetween(ch, 0, 1)).toEqual(['a']);
  });
});

