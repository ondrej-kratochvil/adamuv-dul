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

describe('server: omezení a uchovávání (31. 10. 2026)', () => {
  it('přísnější limit jen na zakládání (hráč, skupina, upozornění)', async () => {
    const { isNewThing } = await import('../../worker/logic');
    expect(isNewThing('POST', '/api/players')).toBe(true);
    expect(isNewThing('POST', '/api/push')).toBe(true);
    expect(isNewThing('POST', '/api/group')).toBe(true);
    expect(isNewThing('PUT', '/api/group')).toBe(true);
    expect(isNewThing('PUT', '/api/me')).toBe(false);
    expect(isNewThing('GET', '/api/leaderboard')).toBe(false);
    expect(isNewThing('POST', '/api/events')).toBe(false);
  });
  it('statistiky se drží rok, nepřihlášený hráč dva roky', async () => {
    const { EVENTS_KEEP_MS, PLAYER_KEEP_MS } = await import('../../worker/logic');
    expect(EVENTS_KEEP_MS).toBe(365 * 864e5);
    expect(PLAYER_KEEP_MS).toBe(730 * 864e5);
  });
});

describe('server: skupiny a body (31. 10. 2026)', () => {
  it('kód skupiny 12 znaků 0-9a-f (velká písmena a mezery se srovnají), název bez nebezpečných znaků', async () => {
    const { validGroupCode, sanitizeGroupName } = await import('../../worker/logic');
    expect(validGroupCode('a1b2c3d4e5f6')).toBe('a1b2c3d4e5f6');
    expect(validGroupCode(' A1B2C3D4E5F6 ')).toBe('a1b2c3d4e5f6');
    expect(validGroupCode('a1b2c3')).toBeNull();
    expect(validGroupCode("a1b2c3d4e5f'")).toBeNull();
    expect(sanitizeGroupName('1. A <b>')).toBe('1. A b');
    expect(sanitizeGroupName('')).toBe('Skupina');
    expect(sanitizeGroupName('x'.repeat(50))).toHaveLength(30);
  });
  it('body: nejvýš poslaná povedená kola + 3 za den (nejvýš 7 dní), nikdy víc, než hra hlásí', async () => {
    const { allowedPoints } = await import('../../worker/logic');
    expect(allowedPoints(1000, 10, 2)).toBe(16);
    expect(allowedPoints(12, 10, 2)).toBe(12);
    expect(allowedPoints(500, 100, 30)).toBe(121);
    expect(allowedPoints(50, 0, 0)).toBe(0);
  });
});
