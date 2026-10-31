// Poklad (Ondřej 31. 10. 2026): najdi věc na písmeno, vyfoť, rodič potvrdí; vlastní obrázky. Fotky jen v zařízení.
import { test, expect } from '@playwright/test';
import { openGame, saved } from './helpers.js';

// malý obrázek PNG místo fotky z fotoaparátu
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGM4YaOBFTEMLQkAdntLARs7+acAAAAASUVORK5CYII=', 'base64');
const photo = name => ({ name, mimeType: 'image/png', buffer: PNG });

test('poklad: písmeno, fotka, rodič potvrdí, smaragdy a fotka ve sbírce (i po znovunačtení)', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999, emeralds: 10 });
  await page.getByRole('button', { name: 'Poklad', exact: true }).click();
  await expect(page.locator('#hunt')).toBeVisible();
  const letter = await page.locator('#huntLetter').textContent();
  const known = await page.evaluate(() => ['A', 'E', 'I', 'O', 'U', ...window.__adam.save.letters]); // samohlásky a zapnuté souhlásky
  expect(known).toContain(letter);
  await expect.poll(() => page.evaluate(() => window.__said.join(' | '))).toContain('Vyfotit');
  await page.locator('#huntFile').setInputFiles(photo('poklad.png'));
  await expect(page.locator('#huntCheck')).toBeVisible();
  await expect(page.locator('#huntCheckLetter')).toHaveText(letter);
  await page.locator('#btnHuntYes').click();
  await expect(page.locator('#huntGrid .photo')).toHaveCount(1);
  await expect(page.locator('#huntGrid .photo-letter')).toHaveText(letter);
  const s = await saved(page);
  expect(s.emeralds).toBe(13);
  expect(s.hunt.today).toEqual([letter]);
  expect(JSON.stringify(s)).not.toContain('data:image'); // fotka není v uloženém stavu (ani v záloze na serveru)
  await page.reload();
  await page.getByRole('button', { name: 'Poklad', exact: true }).click();
  await expect(page.locator('#huntGrid .photo')).toHaveCount(1);
});

test('poklad: „Ještě ne“ fotku zahodí a nic nedá', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999, emeralds: 10 });
  await page.getByRole('button', { name: 'Poklad', exact: true }).click();
  await page.locator('#huntFile').setInputFiles(photo('nic.png'));
  await page.locator('#btnHuntNo').click();
  await expect(page.locator('#huntCheck')).toBeHidden();
  await page.waitForTimeout(300);
  await expect(page.locator('#huntGrid .photo')).toHaveCount(0);
  expect((await saved(page)).emeralds).toBe(10);
});

test('moje obrázky: vyfotit, prohlédnout a smazat (dvě klepnutí)', async ({ page }) => {
  await openGame(page, { total: 3, seenVersion: 999 });
  await page.getByRole('button', { name: 'Poklad', exact: true }).click();
  await page.locator('#btnHuntTabDraw').click();
  await expect(page.locator('#huntDraw')).toBeVisible();
  await page.locator('#huntFile').setInputFiles(photo('obrazek.png'));
  await expect(page.locator('#drawGrid .photo')).toHaveCount(1);
  await page.locator('#drawGrid .photo').click();
  await expect(page.locator('#photoOverlay')).toBeVisible();
  await page.locator('#btnPhotoDel').click();
  await expect(page.locator('#btnPhotoDel')).toContainText('Opravdu');
  await page.locator('#btnPhotoDel').click();
  await expect(page.locator('#photoOverlay')).toBeHidden();
  await expect(page.locator('#drawGrid .photo')).toHaveCount(0);
});
