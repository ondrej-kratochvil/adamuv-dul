// Řada dní podle data v tabletu.
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('včera odehráno, dnes povedené kolo: řada roste a dá bonus', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00+02:00'));
  await openGame(page, { total: 2, streak: { count: 6, best: 6, last: '2026-10-19', totem: 0, days: ['2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'] } });
  await playRound(page, 'Písmena');
  const s = await saved(page);
  expect(s.streak.count).toBe(7);
  expect(s.streak.last).toBe('2026-10-20');
  await expect(page.locator('#endGems')).toContainText('7 za řadu dní');
});

test('vynechaný den bez totemu řadu shodí, s totemem ne', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00+02:00'));
  await openGame(page, { total: 2, streak: { count: 4, best: 4, last: '2026-10-18', totem: 1, days: ['2026-10-18'] } });
  await playRound(page, 'Písmena');
  const s = await saved(page);
  expect(s.streak.count).toBe(5);
  expect(s.streak.totem).toBe(0);
});

test('přelom roku', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-01T09:00:00+01:00'));
  await openGame(page, { total: 2, streak: { count: 3, best: 3, last: '2026-12-31', totem: 0, days: ['2026-12-31'] } });
  await playRound(page, 'Čísla');
  expect((await saved(page)).streak.count).toBe(4);
});
