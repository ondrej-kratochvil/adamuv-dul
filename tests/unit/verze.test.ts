// Každá nová verze hry má záznam novinek pro Adama (pravidlo z CLAUDE.md).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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
