import { describe, expect, it } from 'vitest';
import { applyDay, streakAt, STREAK_BONUS_MAX, type Streak } from '../../src/logic/streak';

const st = (o: Partial<Streak> = {}): Streak => ({ count: 0, best: 0, last: '', totem: 0, days: [], ...o });

describe('řada dní', () => {
  it('první den začíná řadu', () => {
    const s = st();
    expect(applyDay(s, '2026-10-19')).toMatchObject({ count: 1, bonus: 1 });
    expect(s).toMatchObject({ count: 1, best: 1, last: '2026-10-19', days: ['2026-10-19'] });
  });
  it('stejný den se započítá jen jednou', () => {
    const s = st({ count: 3, best: 3, last: '2026-10-19' });
    expect(applyDay(s, '2026-10-19')).toBeNull();
    expect(s.count).toBe(3);
  });
  it('další den řada roste, i přes konec roku', () => {
    const s = st({ count: 3, best: 3, last: '2026-12-31' });
    expect(applyDay(s, '2027-01-01')?.count).toBe(4);
  });
  it('vynechaný den bez totemu řadu shodí, nejdelší řada zůstane', () => {
    const s = st({ count: 9, best: 9, last: '2026-10-17' });
    applyDay(s, '2026-10-19');
    expect(s).toMatchObject({ count: 1, best: 9 });
  });
  it('totem zachrání jeden vynechaný den a spotřebuje se', () => {
    const s = st({ count: 4, best: 4, last: '2026-10-17', totem: 1 });
    expect(applyDay(s, '2026-10-19')).toMatchObject({ count: 5, usedTotem: true });
    expect(s.totem).toBe(0);
  });
  it('totem nezachrání dva vynechané dny', () => {
    const s = st({ count: 4, best: 4, last: '2026-10-16', totem: 1 });
    applyDay(s, '2026-10-19');
    expect(s).toMatchObject({ count: 1, totem: 1 });
  });
  it('bonus smaragdů je nejvýš 10', () => {
    const s = st({ count: 30, best: 30, last: '2026-10-18' });
    expect(applyDay(s, '2026-10-19')?.bonus).toBe(STREAK_BONUS_MAX);
  });
  it('stav řady bez zápisu', () => {
    const s = st({ count: 5, best: 5, last: '2026-10-18', totem: 1 });
    expect(streakAt(s, '2026-10-18')).toMatchObject({ count: 5, today: true });
    expect(streakAt(s, '2026-10-19')).toMatchObject({ count: 5, today: false });
    expect(streakAt(s, '2026-10-20')).toMatchObject({ count: 5, saved: true });
    expect(streakAt(s, '2026-10-21').count).toBe(0);
  });
  it('drží jen posledních 60 dní', () => {
    const s = st({ count: 1, best: 1, last: '2026-08-01', days: ['2026-08-01'] });
    applyDay(s, '2026-10-19');
    expect(s.days).toEqual(['2026-10-19']);
  });
});
