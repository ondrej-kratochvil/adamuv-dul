import { describe, expect, it } from 'vitest';
import { leaderboardRows, sanitizeNick, sanitizeSummary, weekKey } from '../../worker/logic';
import { backupOf, codeOf, parseCode, weekOf, weekPoints } from '../../src/logic/cloud';

describe('server Schoolcraft (worker/logic.ts)', () => {
  it('týden začíná pondělím podle českého času', () => {
    expect(weekKey(new Date('2026-10-25T10:00:00Z'))).toBe('2026-10-19'); // neděle
    expect(weekKey(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26'); // v Praze už pondělí 0:30
    expect(weekKey(new Date('2026-10-26T08:00:00Z'))).toBe('2026-10-26');
  });
  it('přezdívka bez nebezpečných znaků a nejvýš 20 znaků; prázdná = Hráč', () => {
    expect(sanitizeNick('Adam<script>')).toBe('Adamscript');
    expect(sanitizeNick('  Víťa   Kratochvíl  ')).toBe('Víťa Kratochvíl');
    expect(sanitizeNick('x'.repeat(50)).length).toBe(20);
    expect(sanitizeNick('')).toBe('Hráč');
    expect(sanitizeNick(42)).toBe('Hráč');
  });
  it('souhrn: jen známá pole, čísla omezená, oblečení jen jako id', () => {
    const s = sanitizeSummary({ total: 30.4, house: 99, outfit: { shirt: 'oranzove', hat: 'x<y', foo: 'bar' }, secret: 'nic', portal: 'ano' });
    expect(s).toMatchObject({ total: 30, house: 12, outfit: { shirt: 'oranzove' }, portal: false });
    expect(Object.keys(s.outfit)).toEqual(['shirt']);
    expect((s as unknown as Record<string, unknown>).secret).toBeUndefined();
  });
  it('žebříček: body jen z tohoto týdne, řazení podle bodů, já označený', () => {
    const rows = leaderboardRows([
      { id: 'a', nick: 'Adam', week: '2026-10-19', week_points: 12, summary: '{"total":30}' },
      { id: 'v', nick: 'Víťa', week: '2026-10-19', week_points: 15, summary: '{"total":10}' },
      { id: 's', nick: 'Starý', week: '2026-10-12', week_points: 50, summary: 'rozbité' },
    ], '2026-10-19', 'a');
    expect(rows.map(r => [r.nick, r.points, r.me])).toEqual([['Víťa', 15, false], ['Adam', 12, true], ['Starý', 0, false]]);
  });
});

describe('online ve hře (logic/cloud.ts)', () => {
  it('týdenní body: povedené kolo 1, splněný úkol 3, jen tento týden', () => {
    const log = [
      { d: '2026-10-19', ok: true, quit: false }, { d: '2026-10-25', ok: true, quit: false },
      { d: '2026-10-25', ok: false, quit: false }, { d: '2026-10-25', ok: true, quit: true }, { d: '2026-10-18', ok: true, quit: false },
    ];
    expect(weekOf('2026-10-25')).toBe('2026-10-19');
    expect(weekPoints(log, ['2026-10-24', '2026-10-17'], '2026-10-19')).toBe(2 + 3);
  });
  it('kód pro přenos a záloha bez přihlášení a bez tabulky Google', () => {
    const c = { id: '12345678-1234-1234-1234-123456789abc', secret: 'a'.repeat(64) };
    expect(parseCode(codeOf(c))).toEqual(c);
    expect(parseCode('nesmysl')).toBeNull();
    const b = backupOf({ total: 3, cloud: { secret: 'x' }, sync: { url: 'y' } });
    expect(b).toEqual({ total: 3 });
  });
});
