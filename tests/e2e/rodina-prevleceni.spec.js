// Převlékání rodiny a noví příbuzní (verze 28, Ondřej 20. 10. 2026)
import { test, expect } from '@playwright/test';
import { openGame, openSettings, saved } from './helpers.js';

const said = page => page.evaluate(() => window.__said.join(' | '));

test('Adam koupí čepici, dá ji babičce Ivě a pak ji dá i Víťovi', async ({ page }) => {
  await openGame(page, { total: 5, emeralds: 30 });
  await page.getByRole('button', { name: 'Rodina', exact: true }).click();
  await expect(page.locator('#family')).toBeVisible();
  await page.getByRole('button', { name: 'babička Iva', exact: true }).click();
  const cap = page.getByRole('button', { name: 'čepice s bambulí', exact: true });
  await cap.click(); await cap.click();
  let s = await saved(page);
  expect(s.famOwned).toEqual(['cepice']);
  expect(s.famWear).toEqual({ iva: { head: 'cepice' } });
  expect(s.emeralds).toBe(22);
  await expect.poll(() => said(page)).toContain('Babička Iva má teď čepici s bambulí');
  await page.getByRole('button', { name: 'bratranec Víťa', exact: true }).click();
  await cap.click();
  s = await saved(page);
  expect(s.famWear).toEqual({ iva: { head: 'cepice' }, vita: { head: 'cepice' } });
  expect(s.emeralds).toBe(22); // koupená věc se neplatí znovu
  await cap.click();
  expect((await saved(page)).famWear).toEqual({ iva: { head: 'cepice' } });
  await expect.poll(() => said(page)).toContain('Bratranec Víťa už nemá čepici s bambulí');
  await page.screenshot({ path: 'test-results/rodina.png' });
});

test('vzácná koruna je zamčená a drahá věc bez smaragdů nejde koupit', async ({ page }) => {
  await openGame(page, { total: 5, emeralds: 5 });
  await page.getByRole('button', { name: 'Rodina', exact: true }).click();
  await page.getByRole('button', { name: 'zlatá koruna', exact: true }).click();
  await expect.poll(() => said(page)).toContain('vzácná věc');
  await page.getByRole('button', { name: 'vikingská helma', exact: true }).click();
  await expect.poll(() => said(page)).toContain('stojí 15 smaragdů');
  expect((await saved(page)).famOwned).toEqual([]);
});

test('převlečený portrét je vidět i na úvodní obrazovce a Sundat všechno ho vrátí', async ({ page }) => {
  await openGame(page, { total: 5, famOwned: ['klaun'], famWear: { bob: { nose: 'klaun' } } });
  await page.getByRole('button', { name: 'Rodina', exact: true }).click();
  await page.getByRole('button', { name: 'děda Bob', exact: true }).click();
  await page.locator('#btnFamClear').click();
  expect((await saved(page)).famWear).toEqual({});
});

test('noví příbuzní můžou poslat vzkaz', async ({ page }) => {
  await openGame(page, { total: 5 });
  await openSettings(page);
  for (const n of ['strejda Vašek', 'teta Terka', 'bratranec Víťa', 'praděda Ruda', 'Šárka', 'Tomáš', 'prababička Marcelka']) await expect(page.locator('#noteWho').getByRole('button', { name: n, exact: true })).toBeVisible();
});
