// Charakterizační testy: popisují, jak se hra chová, aby převod a další úpravy nic nerozbily.
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved, LEVELS } from './helpers.js';

test('hra se načte bez chyb a ukáže všechna patra', async ({ page }) => {
  const errors = await openGame(page);
  for (const l of LEVELS) await expect(page.getByRole('button', { name: l, exact: true })).toBeVisible();
  for (const l of ['Šatník', 'Obchod', 'Můj dům', 'Farma', 'Vesnice']) await expect(page.getByRole('button', { name: l, exact: true })).toHaveCount(1);
  expect(errors).toEqual([]);
});

for (const level of LEVELS) {
  test(`patro ${level}: kolo bez chyby se počítá`, async ({ page }) => {
    const errors = await openGame(page);
    await playRound(page, level);
    await expect(page.locator('#endTitle')).toHaveText('Výborně, Adame!');
    const s = await saved(page);
    expect(s.total).toBe(1);
    expect(s.emeralds).toBeGreaterThan(0);
    expect(s.log).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

test('kolo s mnoha chybami se nepočítá a nic se nebere', async ({ page }) => {
  await openGame(page, { total: 3, emeralds: 7 });
  await playRound(page, 'Písmena', { wrong: 8 });
  await expect(page.locator('#endTitle')).toHaveText('Skoro!');
  const s = await saved(page);
  expect(s.total).toBe(3);
  expect(s.emeralds).toBe(7);
});

test('psaní: vyjetí z dráhy je chyba', async ({ page }) => {
  await openGame(page);
  await playRound(page, 'Psaní', { wrong: 5 });
  await expect(page.locator('#endTitle')).toHaveText('Skoro!');
});

test('obrazovky šatník, obchod, dům, farma, vesnice a statistiky jdou otevřít', async ({ page }) => {
  const errors = await openGame(page, { total: 25, emeralds: 50 });
  const back = async id => { await page.locator(`#${id}`).click(); await expect(page.locator('#home')).toBeVisible(); };
  await page.getByRole('button', { name: 'Šatník', exact: true }).click(); await expect(page.locator('#wardrobe')).toBeVisible(); await back('btnWardBack');
  await page.getByRole('button', { name: 'Obchod', exact: true }).click(); await expect(page.locator('#shop')).toBeVisible(); await back('btnShopBack');
  await page.getByRole('button', { name: 'Můj dům', exact: true }).click(); await expect(page.locator('#house')).toBeVisible(); await back('btnHouseBack');
  await page.getByRole('button', { name: 'Farma', exact: true }).click(); await expect(page.locator('#farm')).toBeVisible(); await back('btnFarmBack');
  await page.getByRole('button', { name: 'Vesnice', exact: true }).click(); await expect(page.locator('#village')).toBeVisible(); await back('btnVillageBack');
  await page.locator('#btnSettings').click(); await page.locator('#btnStats').click(); await expect(page.locator('#stats')).toBeVisible();
  expect(errors).toEqual([]);
});

test('obchod: první klepnutí vybere, druhé koupí', async ({ page }) => {
  await openGame(page, { total: 14, emeralds: 20 });
  await page.getByRole('button', { name: 'Obchod', exact: true }).click();
  const item = page.getByRole('button', { name: 'modrý obojek' });
  await item.click();
  expect((await saved(page))?.emeralds ?? 20).toBe(20);
  await item.click();
  expect((await saved(page)).emeralds).toBe(15);
});
