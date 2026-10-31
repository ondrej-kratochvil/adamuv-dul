// Ranní upozornění (web push, Ondřej 31. 10. 2026): server každou celou hodinu pošle prázdnou zprávu zařízením,
// která chtějí upozornění v tuhle hodinu českého času; text zobrazí service worker hry (public/sw.js).
// Zpráva je bez obsahu, takže se nešifruje; podepisuje se klíčem VAPID (ES256), který si server sám vytvoří
// a uloží do databáze (tabulka config). Čisté funkce jsou testované v tests/unit/push.test.ts.

export const b64url = (b: ArrayBuffer | Uint8Array): string => {
  let s = ''; for (const x of new Uint8Array(b)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// adresy jen u známých služeb pro upozornění (Google, Mozilla, Apple, Microsoft), nic jiného server volat nebude
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'];
export function validEndpoint(x: unknown): string | null {
  if (typeof x !== 'string' || x.length > 1000) return null;
  try {
    const u = new URL(x);
    if (u.protocol !== 'https:') return null;
    return PUSH_HOSTS.includes(u.hostname) || u.hostname.endsWith('.notify.windows.com') ? u.href : null;
  } catch { return null; }
}
// klíče zařízení (base64url): p256dh 65 bajtů, auth 16 bajtů; teď se nepoužívají (zpráva je prázdná), ukládají se na později
export const validKey = (x: unknown, bytes: number): string | null => {
  if (typeof x !== 'string' || !/^[A-Za-z0-9_-]+$/.test(x)) return null;
  try { return fromB64url(x).length === bytes ? x : null; } catch { return null; }
};
export const HOURS = [5, 6, 7, 8, 9]; // v kolik může upozornění chodit (celé hodiny, český čas)
export const validHour = (x: unknown): number => typeof x === 'number' && HOURS.includes(x) ? x : 7;

// hodina a den v Praze (letní i zimní čas)
export function pragueNow(d: Date = new Date(), tz = 'Europe/Prague'): { hour: number; day: string } {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
  return { hour: +p.hour, day: `${p.year}-${p.month}-${p.day}` };
}
// komu poslat teď: chce tuhle hodinu a dnes ještě nic nedostal
export interface Sub { endpoint: string; hour: number; last_day: string }
export const dueSubs = <T extends Sub>(subs: T[], now: { hour: number; day: string }): T[] => subs.filter(s => s.hour === now.hour && s.last_day !== now.day);

/* ---------- VAPID (RFC 8292) ---------- */
export interface Vapid { publicKey: string; privateJwk: JsonWebKey }
export async function makeVapid(): Promise<Vapid> {
  const k = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  return { publicKey: b64url(await crypto.subtle.exportKey('raw', k.publicKey) as ArrayBuffer), privateJwk: await crypto.subtle.exportKey('jwk', k.privateKey) as JsonWebKey };
}
// podpis pro službu upozornění: JWT ES256 s adresátem (origin služby), platností a kontaktem
export async function vapidAuth(endpoint: string, v: Vapid, now = Date.now(), sub = 'https://schoolcraft.games'): Promise<string> {
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const data = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub })}`;
  const key = await crypto.subtle.importKey('jwk', v.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(data)); // r||s, jak chce JWS
  return `vapid t=${data}.${b64url(sig)}, k=${v.publicKey}`;
}
// odeslání prázdné zprávy; 404 a 410 = zařízení upozornění zrušilo (odinstalace, odvolaný souhlas)
export async function sendPush(endpoint: string, v: Vapid, f: typeof fetch = fetch): Promise<'ok' | 'gone' | 'fail'> {
  try {
    const res = await f(endpoint, { method: 'POST', headers: { Authorization: await vapidAuth(endpoint, v), TTL: String(4 * 3600), Urgency: 'high', 'Content-Length': '0' } });
    return res.ok ? 'ok' : res.status === 404 || res.status === 410 ? 'gone' : 'fail';
  } catch { return 'fail'; }
}

/* ---------- předběhnutí v žebříčku (Ondřej 31. 10. 2026) ---------- */
// koho hráč právě předběhl: tento týden v žebříčku, body mezi jeho starými (včetně) a novými (bez)
export interface RankRow { id: string; week: string; week_points: number; public: number }
export function overtaken(rows: RankRow[], me: string, week: string, before: number, after: number): string[] {
  if (after <= before) return [];
  return rows.filter(r => r.id !== me && r.public === 1 && r.week === week && r.week_points >= before && r.week_points < after).map(r => r.id);
}
// jen přes den (dítě se večer a v noci nebudí) a nejvýš jednou denně
export const RANK_FROM = 8, RANK_TO = 19;
export const rankTime = (hour: number): boolean => hour >= RANK_FROM && hour < RANK_TO;
// text bez rodu (jméno hráče říká, kdo předběhl; hra nezná jeho rod)
export const rankText = (nick: string): { title: string; body: string } => ({ title: 'Schoolcraft', body: `${nick} je v žebříčku před tebou. Zahraješ si?` });
export const NEWS_MS = 3600_000; // zpráva čeká na service worker nejvýš hodinu
