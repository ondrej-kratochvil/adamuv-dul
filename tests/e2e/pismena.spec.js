// Písmena zapnutá rodičem (Ondřej 24. 10. 2026: Adam se učí P, další písmena připravit a zapínat).
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved } from './helpers.js';

test('Adamův dřívější postup má zapnuté i P; rodič zapne T a hra s ním počítá', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  expect((await saved(page)).letters).toEqual(['M', 'L', 'S', 'P']);
  await expect(page.getByRole('button', { name: 'Písmena', exact: true }).locator('.lvl-sub')).toContainText('z 17');
  await openSettings(page, 'game');
  await expect(page.locator('#letterToggles [data-letter="P"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#letterToggles [data-letter="T"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#letterToggles [data-letter="T"]').click();
  await expect(page.locator('#lettersInfo')).toContainText('Zapnuto: M, L, S, P, T');
  expect((await saved(page)).letters).toEqual(['M', 'L', 'S', 'P', 'T']);
  await page.locator('#btnSetClose').click();
  await expect(page.getByRole('button', { name: 'Písmena', exact: true }).locator('.lvl-sub')).toContainText('z 18');
  await playRound(page, 'Slova');
  await expect(page.locator('#endOverlay')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Písmena', exact: true }).locator('.lvl-sub')).toContainText('z 18');
});

test('nový hráč začíná se samohláskami a M, L, S; poslední souhlásku vypnout nejde', async ({ page }) => {
  await openGame(page, null, { fresh: true });
  await page.locator('#setupName').fill('Jakub');
  await page.locator('#btnSetupGo').click();
  expect((await saved(page)).letters).toEqual(['M', 'L', 'S']);
  await openSettings(page, 'game');
  for (const c of ['M', 'L']) await page.locator(`#letterToggles [data-letter="${c}"]`).click();
  await page.locator('#letterToggles [data-letter="S"]').click(); // poslední zůstane
  expect((await saved(page)).letters).toEqual(['S']);
});
