// Nástroje v šatníku: zamčené se zámkem, odemčené jde vzít do ruky.
import { test, expect } from '@playwright/test';
import { openGame, saved } from './helpers.js';

test('šatník ukáže nástroje se zámky a vybraný jde do ruky', async ({ page }) => {
  await openGame(page, { total: 3 });
  await page.getByRole('button', { name: 'Šatník', exact: true }).click();
  await page.getByRole('button', { name: 'Nástroje', exact: true }).click();
  await expect(page.locator('.tool-row')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'netheritový meč' })).toHaveClass(/locked/);
  await page.getByRole('button', { name: 'netheritový meč' }).click();
  await expect.poll(() => page.evaluate(() => window.__said.at(-1))).toContain('Počty a Čísla');
  await page.getByRole('button', { name: 'dřevěný meč' }).click();
  expect((await saved(page)).gear.held).toBe('sword');
});

test('materiál nástroje se dopočítá podle už zvládnutých úkolů hned po spuštění', async ({ page }) => {
  const stats = {}; for (const c of 'AÁEÉIÍOÓUÚŮYÝMLS') stats['letters:' + c] = { ok: 3, miss: 0, n: 3 };
  for (const c of ['MA','ME','MI','MO','MU','LA','LE','LI','LO','LU','SA','SE','SI','SO','SU']) stats['syllables:' + c] = { ok: 3, miss: 0, n: 3 };
  await openGame(page, { total: 3, gear: { held: 'pick', stages: {} }, stats });
  await page.reload();
  expect((await saved(page)).gear.stages.shovel).toBe(1); // 31 úkolů z Písmen, Slabik a Mluvení (přes 20 %, pod 40 %) = kámen
  await page.getByRole('button', { name: 'Šatník', exact: true }).click();
  await page.getByRole('button', { name: 'Nástroje', exact: true }).click();
  await expect(page.getByRole('button', { name: 'kamenná lopata' })).not.toHaveClass(/locked/);
});

// Ondřej 24. 10. 2026: na mobilu byly nástroje moc malé (7 sloupců vedle sebe, kostička kolem 40 px)
for (const width of [360, 412]) {
  test(`nástroje na mobilu (${width} px) jsou dost velké na klepnutí`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await openGame(page, { total: 3 });
    await page.getByRole('button', { name: 'Šatník', exact: true }).click();
    await page.getByRole('button', { name: 'Nástroje', exact: true }).click();
    for (const c of await page.locator('.tool-cell').all()) {
      const b = await c.boundingBox();
      expect(b.width).toBeGreaterThanOrEqual(64);
      expect(b.x + b.width).toBeLessThanOrEqual(width);
    }
    await page.locator('.ward-panel').screenshot({ path: `test-results/nastroje-${width}.png` });
  });
}
