import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { privacyPage } from '../../vite.config.js';

// soukromi.html pro Google Play (11. 11. 2026) vzniká při sestavení z okna O hře v index.html
describe('zásady ochrany soukromí (soukromi.html)', () => {
  const page = privacyPage(readFileSync('index.html', 'utf8'));
  it('obsahuje všechny oddíly okna O hře a smazání bez aplikace', () => {
    for (const t of ['K čemu hra je', 'Bezpečnost pro dítě', 'Co se kam ukládá', 'Přirozený hlas', 'Smazání údajů', 'Bez aplikace', 'Správce a kontakt']) expect(page).toContain(t);
  });
  it('je samostatná stránka bez prvků hry', () => {
    expect(page).toMatch(/^<!doctype html>/);
    expect(page).not.toContain('aboutVersion');
    expect(page).not.toContain('btnAboutClose');
  });
  it('bez okna O hře sestavení selže, stránka nezmizí potichu', () => {
    expect(() => privacyPage('<html></html>')).toThrow();
  });
});
