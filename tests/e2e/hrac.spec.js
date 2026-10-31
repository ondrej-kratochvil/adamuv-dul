// Hráč (Schoolcraft, Ondřej 24. 10. 2026): nová hra se zeptá, kdo hraje; rodič nastaví rodinu; soubor hráče jde přenést.
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound, saved, settingsTab } from './helpers.js';

test('nová hra: jméno a rod, pak hra oslovuje hráče a jmenuje se Schoolcraft', async ({ page }) => {
  await openGame(page, null, { fresh: true });
  await expect(page.locator('#setupOverlay')).toBeVisible();
  await expect(page.locator('#dayOverlay')).toBeHidden(); // ranní karta počká
  await page.locator('#setupName').fill('Ema');
  await page.locator('#setupGender [data-g="f"]').click();
  await expect(page.locator('#setupVoc')).toContainText('Emo');
  await page.locator('#btnSetupGo').click();
  await expect(page.locator('#setupOverlay')).toBeHidden();
  await expect(page.locator('#gameTitle')).toHaveText('Schoolcraft');
  expect((await saved(page)).player).toMatchObject({ name: 'Ema', voc: 'Emo', poss: 'Emin', gender: 'f' });
  await expect(page.locator('.fan')).toContainText('Ahoj Emo!');
  if (await page.locator('#dayOverlay').isVisible()) await page.locator('#btnDayLater').click();
  await playRound(page, 'Písmena');
  await expect(page.locator('#endTitle')).toHaveText('Výborně, Emo!');
  const said = await page.evaluate(() => window.__said.join(' '));
  expect(said).not.toContain('Adam');
  await page.reload();
  await expect(page.locator('#setupOverlay')).toBeHidden(); // podruhé už se neptá
});

test('karta Hráč: u Adama vestavěný hráč, nový člen rodiny z něj udělá vlastní kopii', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  await openSettings(page, 'player');
  await expect(page.locator('#plBuiltin')).toBeVisible();
  await expect(page.locator('#plVoc')).toHaveValue('Adame');
  await expect(page.locator('#plFamily .fam-row')).toHaveCount(14);
  await page.locator('#btnFamAdd').click();
  await page.locator('#feName').fill('teta Věra');
  await page.locator('#feName').dispatchEvent('change');
  await expect(page.locator('#feGen')).toHaveValue('tety Věry');
  await page.locator('#feF').check();
  await page.locator('#feCheers').fill('Výborně, Adame!\nTo je paráda!');
  await page.locator('#btnFeSave').click();
  await expect(page.locator('#plFamily .fam-row')).toHaveCount(15);
  await expect(page.locator('#plBuiltin')).toBeHidden();
  const p = (await saved(page)).player;
  expect(p.name).toBe('Adam');
  expect(p.family.find(m => m.name === 'teta Věra')).toMatchObject({ gen: 'tety Věry', f: true, lines: { cheers: ['Výborně, Adame!', 'To je paráda!'] } });
  // vzkazy: nová teta je mezi odesílateli
  await settingsTab(page, 'family');
  await expect(page.locator('#noteWho')).toContainText('teta Věra');
});

test('změna jména dopočítá oslovení; soubor hráče jde vložit na jiném zařízení', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openGame(page, null, { fresh: true });
  await page.locator('#setupName').fill('Víťa');
  await page.locator('#btnSetupGo').click();
  await openSettings(page, 'player');
  await expect(page.locator('#plVoc')).toHaveValue('Víťo');
  await page.locator('#btnFamAdd').click();
  await page.locator('#feName').fill('táta Vašek');
  await page.locator('#feMom').uncheck();
  await page.locator('#btnFeSave').click();
  await page.locator('#btnPlExport').click();
  const text = await page.locator('#plText').inputValue();
  expect(text).toMatch(/^SCHOOLCRAFT-HRAC:/);
  const p2 = await context.newPage();
  await openGame(p2, { total: 5, seenVersion: 999 });
  await openSettings(p2, 'player');
  await p2.locator('#btnPlImport').click();
  await p2.locator('#plText').fill(text);
  await expect(p2.locator('#plMsg')).toContainText('hraje Víťa, rodina 1');
  const s = await saved(p2);
  expect(s.player).toMatchObject({ name: 'Víťa', voc: 'Víťo' });
  expect(s.total).toBe(5); // postup zůstal
});

test('nová hra: písmena se vyberou hned při založení hráče (Vašek 25. 10. 2026)', async ({ page }) => {
  await openGame(page, null, { fresh: true });
  await page.locator('#setupName').fill('Víťa');
  await page.locator('#setupLetters [data-letter="P"]').click();
  await page.locator('#setupLetters [data-letter="T"]').click();
  await page.locator('#btnSetupGo').click();
  expect((await saved(page)).letters).toEqual(['M', 'L', 'S', 'P', 'T']);
});

test('úvodní nastavení: jde vypnout i M (poslední souhláska), začít jde až s nějakou (Ondřej 25. 10. 2026)', async ({ page }) => {
  await openGame(page, null, { fresh: true });
  await page.locator('#setupName').fill('Víťa');
  for (const c of ['M', 'L', 'S']) await page.locator(`#setupLetters [data-letter="${c}"]`).click();
  await expect(page.locator('#setupLetters [data-letter="M"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#btnSetupGo').click();
  await expect(page.locator('#setupOverlay')).toBeVisible();
  await expect(page.locator('#setupVoc')).toContainText('aspoň jednu souhlásku');
  await page.locator('#setupLetters [data-letter="P"]').click();
  await page.locator('#btnSetupGo').click();
  await expect(page.locator('#setupOverlay')).toBeHidden();
  expect((await saved(page)).letters).toEqual(['P']);
});
