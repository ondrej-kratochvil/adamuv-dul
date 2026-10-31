// Ranní upozornění na serveru (worker/push.ts): komu a kdy poslat, podpis VAPID, odeslání.
import { describe, expect, it } from 'vitest';
import { b64url, dueSubs, fromB64url, makeVapid, overtaken, pragueNow, rankText, rankTime, sendPush, validEndpoint, validHour, validKey, vapidAuth } from '../../worker/push';

describe('ranní upozornění: server', () => {
  it('posílá jen na známé služby upozornění přes https', () => {
    expect(validEndpoint('https://fcm.googleapis.com/fcm/send/abc:123')).toBe('https://fcm.googleapis.com/fcm/send/abc:123');
    expect(validEndpoint('https://web.push.apple.com/QGx')).toBeTruthy();
    expect(validEndpoint('https://wns2-par02p.notify.windows.com/w/?token=x')).toBeTruthy();
    expect(validEndpoint('http://fcm.googleapis.com/x')).toBeNull();
    expect(validEndpoint('https://schoolcraft.games/api/me')).toBeNull();
    expect(validEndpoint('https://fcm.googleapis.com.zlo.cz/x')).toBeNull();
    expect(validEndpoint('nesmysl')).toBeNull();
    expect(validEndpoint(42)).toBeNull();
  });
  it('klíče zařízení jen ve správné délce, hodina jen z nabídky (jinak 7)', () => {
    expect(validKey(b64url(new Uint8Array(16)), 16)).toBeTruthy();
    expect(validKey(b64url(new Uint8Array(15)), 16)).toBeNull();
    expect(validKey('a+b/', 16)).toBeNull();
    expect(validHour(6)).toBe(6);
    expect(validHour(3)).toBe(7);
    expect(validHour('7')).toBe(7);
  });
  it('hodina podle českého času v létě i v zimě', () => {
    expect(pragueNow(new Date('2026-10-24T05:00:00Z'))).toEqual({ hour: 7, day: '2026-10-24' }); // letní čas UTC+2
    expect(pragueNow(new Date('2026-10-26T06:00:00Z'))).toEqual({ hour: 7, day: '2026-10-26' }); // zimní čas UTC+1
    expect(pragueNow(new Date('2026-10-26T23:30:00Z')).day).toBe('2026-10-27');
  });
  it('v jednu hodinu jen ti, kdo ji chtějí a dnes ještě nic nedostali', () => {
    const subs = [{ endpoint: 'a', hour: 7, last_day: '' }, { endpoint: 'b', hour: 7, last_day: '2026-10-31' }, { endpoint: 'c', hour: 6, last_day: '' }, { endpoint: 'd', hour: 7, last_day: '2026-10-30' }];
    expect(dueSubs(subs, { hour: 7, day: '2026-10-31' }).map(s => s.endpoint)).toEqual(['a', 'd']);
  });
  it('podpis VAPID: JWT ES256 pro službu upozornění, ověřitelný veřejným klíčem serveru', async () => {
    const v = await makeVapid();
    expect(fromB64url(v.publicKey)).toHaveLength(65);
    const now = Date.parse('2026-10-31T06:00:00Z');
    const h = await vapidAuth('https://fcm.googleapis.com/fcm/send/xyz', v, now);
    const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h)!;
    expect(m).toBeTruthy();
    expect(m[4]).toBe(v.publicKey);
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(m[2])));
    expect(claims).toMatchObject({ aud: 'https://fcm.googleapis.com', exp: now / 1000 + 12 * 3600, sub: 'https://schoolcraft.games' });
    const pub = await crypto.subtle.importKey('raw', fromB64url(v.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, fromB64url(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`))).toBe(true);
  });
  it('odeslání: prázdná zpráva s podpisem; 404 a 410 = zařízení zrušené, jinak chyba', async () => {
    const v = await makeVapid();
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = (status: number) => (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response(null, { status }); }) as unknown as typeof fetch;
    expect(await sendPush('https://fcm.googleapis.com/x', v, fake(201))).toBe('ok');
    const hd = calls[0].init.headers as Record<string, string>;
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBeUndefined();
    expect(hd.Authorization).toMatch(/^vapid t=/);
    expect(hd.TTL).toBe('14400');
    expect(await sendPush('https://fcm.googleapis.com/x', v, fake(410))).toBe('gone');
    expect(await sendPush('https://fcm.googleapis.com/x', v, fake(404))).toBe('gone');
    expect(await sendPush('https://fcm.googleapis.com/x', v, fake(500))).toBe('fail');
    expect(await sendPush('https://fcm.googleapis.com/x', v, (async () => { throw new Error('síť'); }) as unknown as typeof fetch)).toBe('fail');
  });
  it('předběhnutí: jen hráči v žebříčku tento týden, které nové body přeskočily', () => {
    const rows = [
      { id: 'me', week: 'W', week_points: 5, public: 1 },
      { id: 'a', week: 'W', week_points: 10, public: 1 },  // přeskočený
      { id: 'b', week: 'W', week_points: 5, public: 1 },   // měl stejně jako já předtím: teď je za mnou
      { id: 'c', week: 'W', week_points: 20, public: 1 },  // pořád přede mnou
      { id: 'd', week: 'W', week_points: 12, public: 0 },  // není v žebříčku
      { id: 'e', week: 'V', week_points: 8, public: 1 },   // minulý týden
    ];
    expect(overtaken(rows, 'me', 'W', 5, 15)).toEqual(['a', 'b']);
    expect(overtaken(rows, 'me', 'W', 15, 15)).toEqual([]);
    expect(overtaken(rows, 'me', 'W', 15, 10)).toEqual([]);
  });
  it('předběhnutí jen přes den (8 až 19 h) a text bez rodu', () => {
    expect(rankTime(7)).toBe(false); expect(rankTime(8)).toBe(true); expect(rankTime(18)).toBe(true); expect(rankTime(19)).toBe(false);
    expect(rankText('Víťa').body).toBe('Víťa je v žebříčku před tebou. Zahraješ si?');
  });
});

