// Uložený postup: nová verze hry nesmí Adamovi nic vzít.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openGame, saved } from './helpers.js';

const sample = JSON.parse(readFileSync(new URL('../fixtures/save-pokrocily.json', import.meta.url)));
const oldest = JSON.parse(readFileSync(new URL('../fixtures/save-nejstarsi.json', import.meta.url)));

test('pokročilý postup přežije načtení beze ztrát', async ({ page }) => {
  const errors = await openGame(page, sample);
  await page.reload();
  const s = await saved(page);
  for (const k of ['total', 'emeralds', 'dogName', 'gameName', 'obsidian', 'eyes', 'dragon']) expect(s[k], k).toEqual(sample[k]);
  expect(s.rounds).toMatchObject(sample.rounds);
  expect(s.outfit).toMatchObject(sample.outfit);
  expect(s.streak).toMatchObject(sample.streak);
  expect(s.dog).toMatchObject(sample.dog);
  expect(s.ench).toEqual(expect.arrayContaining(sample.ench));
  expect(Object.keys(s.stats)).toEqual(expect.arrayContaining(Object.keys(sample.stats)));
  expect(errors).toEqual([]);
});

test('nejstarší uložený stav (první verze hry) se načte a doplní', async ({ page }) => {
  const errors = await openGame(page, oldest);
  await expect(page.locator('#homeGems')).toContainText('0');
  await page.reload();
  const s = await saved(page);
  expect(s.total).toBe(oldest.total);
  expect(s.rounds.letters).toBe(oldest.rounds.letters);
  expect(s.stats['letters:A']).toMatchObject(oldest.stats['letters:A']);
  expect(s.streak).toBeTruthy();
  expect(errors).toEqual([]);
});

test('poškozená data nesloží hru', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('adamuv-dul-v1', '{nesmysl'); } });
  const errors = await openGame(page);
  expect(errors).toEqual([]);
});
