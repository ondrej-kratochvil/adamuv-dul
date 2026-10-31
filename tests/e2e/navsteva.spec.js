// Návštěva (Ondřej 31. 10. 2026: Adam ukazuje hru dědovi Markovi): dnes fandí jen vybraní hosté jejich schválenými hláškami
import { test, expect } from '@playwright/test';
import { openGame, openSettings, playRound } from './helpers.js';

test('návštěva dědy Marka a Šárky: pozdrav na úvodní obrazovce, po kole fandí jen oni, ukončení vrátí celou rodinu', async ({ page }) => {
  await openGame(page, { total: 5, seenVersion: 999 });
  await openSettings(page, 'family');
  await page.locator('#visitWho [data-who="marek"]').click();
  await page.locator('#visitWho [data-who="sarka"]').click();
  await page.locator('#btnVisitOn').click();
  await expect(page.locator('#visitInfo')).toContainText('děda Marek, Šárka');
  await page.locator('#btnSetClose').click();
  await expect(page.locator('.fan')).toContainText('Na návštěvě: děda Marek, Šárka');
  for (let i = 0; i < 2; i++) {
    await playRound(page, i ? '' : 'Písmena');
    await expect(page.locator('#cheer .bubble b')).toHaveText(/^(děda Marek|Šárka)$/);
    if (i === 0) await page.locator('#btnAgain').click();
  }
  await page.locator('#btnEndHome').click();
  await openSettings(page, 'family');
  await page.locator('#btnVisitOff').click();
  await expect(page.locator('#visitInfo')).toContainText('celá rodina');
  await page.locator('#btnSetClose').click();
  await expect(page.locator('.fan')).not.toContainText('Na návštěvě');
});
