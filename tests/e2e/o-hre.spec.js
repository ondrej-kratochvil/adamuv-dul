// O hře a soukromí pro rodiče (Ondřej 31. 10. 2026): dostupné při prvním spuštění, na úvodní obrazovce a na kartě Online
import { test, expect } from '@playwright/test';
import { openGame, openSettings } from './helpers.js';

async function checkAbout(page) {
  const o = page.locator('#aboutOverlay');
  await expect(o).toBeVisible();
  for (const h of ['K čemu hra je', 'Bezpečnost pro dítě', 'Co se kam ukládá', 'Smazání údajů', 'Správce a kontakt']) await expect(o.getByRole('heading', { name: h })).toBeVisible();
  await expect(o).toContainText('jména a narozeniny členů rodiny'); // co záloha na serveru opravdu obsahuje
  await expect(o).toContainText('jen tady a nikam se neposílají'); // fotky
  await expect(o).toContainText('i písma jsou přímo na serveru hry');
  await expect(o).toContainText('mažou po 12 měsících');
  await expect(page.locator('#aboutVersion')).toHaveText(/^Verze hry \d+$/);
  await page.locator('#btnAboutClose').click();
  await expect(o).toBeHidden();
}

test('nový hráč: informace o hře a soukromí jdou otevřít už z úvodního nastavení (bez zámku)', async ({ page }) => {
  await openGame(page, null, { fresh: true });
  await expect(page.locator('#setupOverlay')).toBeVisible();
  await page.locator('#btnSetupAbout').click();
  await checkAbout(page);
  await expect(page.locator('#setupOverlay')).toBeVisible(); // po zavření pokračuje nastavení hráče
});

test('úvodní obrazovka a karta Online: odkaz O hře a soukromí', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  await page.locator('#btnAbout').click();
  await checkAbout(page);
  await openSettings(page, 'online');
  await page.locator('#btnOnlineAbout').click();
  await expect(page.locator('#aboutOverlay')).toBeVisible();
});
