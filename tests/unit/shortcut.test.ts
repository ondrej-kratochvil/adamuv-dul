// Zkratky na ikoně aplikace (manifest shortcuts)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { shortcutTarget } from '../../src/logic/shortcut';

describe('zkratky na ikoně', () => {
  it('?go=ukol a ?go=procvicit, jinak nic', () => {
    expect(shortcutTarget('?go=ukol')).toBe('quest');
    expect(shortcutTarget('?go=procvicit')).toBe('practice');
    expect(shortcutTarget('')).toBeNull();
    expect(shortcutTarget('?go=jinam')).toBeNull();
  });
  it('manifest má obě zkratky a vedou na adresy, které hra zná', () => {
    const m = JSON.parse(readFileSync(new URL('../../public/manifest.webmanifest', import.meta.url), 'utf8'));
    expect(m.shortcuts.map((s: { url: string }) => shortcutTarget(s.url.replace('./', '')))).toEqual(['quest', 'practice']);
  });
});
