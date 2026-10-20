// Střídání pater (Ondřej 20. 10. 2026): po 3 kolech stejného patra nabídne jiné
import { test, expect } from '@playwright/test';
import { openGame, playRound } from './helpers.js';

test('po třetím kole Písmen za sebou nabídne jiné patro a Písmena odpočívají', async ({ page }) => {
  const log = [1, 2].map(i => ({ t: Date.now() - i * 60000, d: '2026-10-20', level: 'letters', clean: 8, done: 8, len: 8, ok: true, quit: false, secs: 40 }));
  await openGame(page, { total: 5, seenVersion: 999, log });
  await playRound(page, 'Písmena');
  const again = page.locator('#btnAgain');
  await expect(again).toContainText('Hrát ');
  await expect.poll(() => page.evaluate(() => window.__said.join(' | '))).toContain('Patro Písmena si teď dá pauzu');
  const lv = await page.locator('#endOverlay').getAttribute('data-level');
  expect(lv).not.toBe('letters');
  await page.locator('#btnEndHome').click();
  const tile = page.getByRole('button', { name: 'Písmena', exact: true });
  await expect(tile).toHaveClass(/resting/);
  await tile.click();
  await expect(page.locator('#game')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__said.join(' | '))).toContain('si teď dává pauzu');
});
