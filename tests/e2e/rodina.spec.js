// Hlášky rodiny ve hře.
import { test, expect } from '@playwright/test';
import { openGame, playRound, saved } from './helpers.js';

test('večer po kole připomene máma zuby a postel, jen jednou', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T20:10:00+02:00'));
  await openGame(page, { total: 3 });
  await playRound(page, 'Písmena');
  await expect(page.locator('#cheer')).toContainText('máma Pája');
  await expect(page.locator('#cheer')).toContainText('čistit zuby');
  expect((await saved(page)).momSaid).toEqual({ d: '2026-10-20', ids: ['spat'] });
});

test('pozdrav na úvodní obrazovce je vlastní věta', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('.fan .bubble')).toContainText(/Ahoj Adam/);
  await expect(page.locator('.fan .bubble')).not.toContainText('Dneska ti fandí');
});
