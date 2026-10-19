import { describe, expect, it } from 'vitest';
import { dayNum, dayStr, easterMonday, holidayOn, seasonOf, weekKey } from '../../src/logic/calendar';

describe('kalendář', () => {
  it('den jako text v místním čase', () => {
    expect(dayStr(new Date(2026, 9, 19, 23, 59))).toBe('2026-10-19');
    expect(dayStr(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01');
  });
  it('rozdíl dní nezávisí na letním čase', () => {
    expect(dayNum('2026-10-26') - dayNum('2026-10-24')).toBe(2); // přechod na zimní čas 25. 10.
    expect(dayNum('2027-03-29') - dayNum('2027-03-27')).toBe(2); // přechod na letní čas 28. 3.
    expect(dayNum('2027-01-01') - dayNum('2026-12-31')).toBe(1);
  });
  it('Velikonoční pondělí', () => {
    expect(easterMonday(2024)).toBe('2024-04-01');
    expect(easterMonday(2025)).toBe('2025-04-21');
    expect(easterMonday(2026)).toBe('2026-04-06');
    expect(easterMonday(2027)).toBe('2027-03-29');
    expect(easterMonday(2030)).toBe('2030-04-22');
  });
  it('svátky a rodinná výročí', () => {
    expect(holidayOn(new Date(2027, 5, 17))?.id).toBe('narozeniny');
    expect(holidayOn(new Date(2026, 11, 24))?.gift).toBe(20);
    expect(holidayOn(new Date(2027, 5, 4))?.who).toBe('david');
    expect(holidayOn(new Date(2026, 3, 6))?.id).toBe('velikonoce');
    expect(holidayOn(new Date(2026, 9, 19))).toBeNull();
  });
  it('roční období', () => {
    expect(seasonOf(new Date(2026, 9, 19))).toBe('autumn');
    expect(seasonOf(new Date(2026, 11, 1))).toBe('xmas');
    expect(seasonOf(new Date(2027, 0, 6))).toBe('xmas');
    expect(seasonOf(new Date(2027, 0, 7))).toBe('winter');
    expect(seasonOf(new Date(2027, 4, 1))).toBe('');
  });
  it('týden začíná pondělím', () => {
    expect(weekKey('2026-10-19')).toBe('2026-10-19'); // pondělí
    expect(weekKey('2026-10-25')).toBe('2026-10-19'); // neděle
    expect(weekKey('2027-01-01')).toBe('2026-12-28');
  });
});
