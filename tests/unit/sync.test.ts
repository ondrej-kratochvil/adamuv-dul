// Fronta pro tabulku Google (verze 27)
import { describe, expect, it } from 'vitest';
import { acknowledge, enqueue, localStamp, QUEUE_MAX, syncDefaults, validSyncUrl } from '../../src/logic/sync';

describe('odesílání do tabulky Google', () => {
  it('pozná adresu nasazeného Apps Scriptu', () => {
    expect(validSyncUrl('https://script.google.com/macros/s/AKfycbx_12-ab/exec')).toBe(true);
    expect(validSyncUrl(' https://script.google.com/macros/s/AKfy/exec ')).toBe(true);
    for (const u of ['', 'http://script.google.com/macros/s/a/exec', 'https://script.google.com/macros/s/a/dev', 'https://example.com/macros/s/a/exec']) expect(validSyncUrl(u)).toBe(false);
  });
  it('každý řádek dostane jedinečné ID; potvrzené řádky z fronty zmizí, nové zůstanou', () => {
    const s = syncDefaults();
    enqueue(s, [{ Druh: 'kolo' }, { Druh: 'úloha' }], 1000);
    const ids = s.queue.map(r => String(r.ID));
    expect(new Set(ids).size).toBe(2);
    enqueue(s, [{ Druh: 'hodnocení' }], 2000); // přibyl během odesílání
    acknowledge(s, ids, 3000);
    expect(s.queue.map(r => r.Druh)).toEqual(['hodnocení']);
    expect(s.sent).toBe(2);
    expect(s.last).toBe(3000);
  });
  it('plná fronta zahodí nejstarší řádky', () => {
    const s = syncDefaults();
    enqueue(s, Array.from({ length: QUEUE_MAX + 5 }, (_, i) => ({ i })), 1);
    expect(s.queue.length).toBe(QUEUE_MAX);
    expect(s.queue[0].i).toBe(5);
  });
  it('čas ve tvaru pro tabulku', () => {
    expect(localStamp(new Date(2026, 9, 20, 7, 5, 9).getTime())).toBe('2026-10-20 07:05:09');
  });
});
