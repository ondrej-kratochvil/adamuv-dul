// Přirozený hlas (audio/speech.js): server a přehrávač napodobí mockCloudVoice (tests/e2e/helpers.js).
// Ondřej 10. 11. 2026: na iPhonu v patře Slova každé druhé slovo nezaznělo.
import { test, expect } from '@playwright/test';
import { openGame, playRound } from './helpers.js';

for (const level of ['Slova', 'Písmena', 'Čtení']) {
  test(`${level}: každé zadání se přehraje přirozeným hlasem`, async ({ page }) => {
    const errors = await openGame(page, { total: 3 }, { cloudVoice: true });
    await playRound(page, level, { listen: true });
    await page.waitForTimeout(500);
    const played = await page.evaluate(() => window.__played);
    const said = await page.evaluate(() => window.__said);
    const asked = errors.asked;
    // každá věta, o kterou hra požádala, se i přehrála; hlas zařízení nemusel zaskakovat
    expect(asked.length).toBeGreaterThan(6);
    expect(asked.filter(t => !played.includes(t))).toEqual([]);
    expect(said).toEqual([]);
    expect(errors.filter(e => typeof e === 'string')).toEqual([]);
  });
}

// iPhone (Honza 10. 11. 2026, verze 84: hra občas mlčela): první skutečné klepnutí přehrávač odemkne,
// pak se přehraje každé zadání, i když přijde až po stažení věty (bez klepnutí)
test('iPhone: po prvním klepnutí přehrávač hraje i zadání bez klepnutí', async ({ page }) => {
  const errors = await openGame(page, { total: 3 }, { cloudVoice: true, ios: true });
  await page.getByRole('button', { name: 'Slova', exact: true }).first().click(); // skutečné klepnutí
  await playRound(page, null, { listen: true });
  await page.waitForTimeout(500);
  const played = await page.evaluate(() => window.__played);
  expect(errors.asked.length).toBeGreaterThan(6);
  expect(errors.asked.filter(t => !played.includes(t))).toEqual([]);
  expect(await page.evaluate(() => window.__blocked)).toBe(0);
});
