// Fronta pro tabulku Google (verze 27)
import { describe, expect, it } from 'vitest';
import { acknowledge, enqueue, ensureDevice, localStamp, QUEUE_MAX, syncDefaults, validSyncUrl } from '../../src/logic/sync';
import { seeded } from '../../src/logic/random';

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

describe('více zařízení v jedné tabulce (21. 10. 2026)', () => {
  it('nové zařízení dostane název podle druhu a značku; řádky nesou název i značku v ID', () => {
    const t = syncDefaults(); ensureDevice(t, true, seeded(1));
    const p = syncDefaults(); ensureDevice(p, false, seeded(2));
    expect(t.device).toBe('tablet'); expect(p.device).toBe('počítač');
    expect(t.uid).toMatch(/^[0-9a-z]{4}$/); expect(t.uid).not.toBe(p.uid);
    p.device = 'počítač děda Bob';
    enqueue(t, [{ Druh: 'kolo' }], 1000); enqueue(p, [{ Druh: 'kolo' }], 1000);
    expect(t.queue[0].Zařízení).toBe('tablet'); expect(p.queue[0].Zařízení).toBe('počítač děda Bob');
    expect(t.queue[0].ID).not.toBe(p.queue[0].ID);
  });
  it('název, který už je nastavený, se nepřepíše', () => {
    const s = syncDefaults(); s.device = 'počítač děda Bob'; ensureDevice(s, true);
    expect(s.device).toBe('počítač děda Bob');
  });
});

