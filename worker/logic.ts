// Schoolcraft server: čisté funkce (bez Cloudflare API), testované v tests/unit/worker.test.ts.
// Do žebříčku jde jen přezdívka, postavička a co má hráč postavené; žádné jméno rodiny, chyby ani statistiky.

// pondělí týdne (RRRR-MM-DD) podle českého času; žebříček se nuluje v pondělí
export function weekKey(d: Date = new Date(), tz = 'Europe/Prague'): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(d).map(x => [x.type, x.value]));
  const local = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  const dow = (local.getUTCDay() + 6) % 7; // pondělí = 0
  local.setUTCDate(local.getUTCDate() - dow);
  return local.toISOString().slice(0, 10);
}

// přezdívka: bez řídicích znaků a ostrých závorek, nejvýš 20 znaků
export function sanitizeNick(x: unknown): string {
  const s = typeof x === 'string' ? x.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20) : '';
  return s || 'Hráč';
}

const int = (x: unknown, max: number): number => typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.min(max, Math.round(x))) : 0;
const id = (x: unknown): string => typeof x === 'string' && /^[a-z0-9-]{1,24}$/.test(x) ? x : '';

export interface Summary {
  outfit: Record<string, string>; total: number; house: number; farm: number; village: number; pets: number;
  babies: number; streak: number; cards: number; dragon: number; portal: boolean;
}
// souhrn od hry: jen známá pole, čísla omezená, oblečení jako id (hra si podle nich postavičku nakreslí sama)
export function sanitizeSummary(raw: unknown): Summary {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const o = (r.outfit && typeof r.outfit === 'object' ? r.outfit : {}) as Record<string, unknown>;
  const outfit: Record<string, string> = {};
  for (const k of ['shirt', 'pants', 'shoes', 'hat', 'enchant']) { const v = id(o[k]); if (v) outfit[k] = v; }
  return {
    outfit, total: int(r.total, 100000), house: int(r.house, 12), farm: int(r.farm, 50), village: int(r.village, 20), pets: int(r.pets, 50),
    babies: int(r.babies, 50), streak: int(r.streak, 10000), cards: int(r.cards, 10000), dragon: int(r.dragon, 1000), portal: r.portal === true,
  };
}

export const MAX_SAVE = 1_500_000; // znaků zálohy postupu
// skupina v žebříčku: kód pozvánky 12 znaků 0-9a-f, název jako přezdívka (nejvýš 30 znaků)
export const validGroupCode = (x: unknown): string | null => typeof x === 'string' && /^[0-9a-f]{12}$/.test(x.trim().toLowerCase()) ? x.trim().toLowerCase() : null;
export function sanitizeGroupName(x: unknown): string {
  const s = typeof x === 'string' ? x.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30) : '';
  return s || 'Skupina';
}
// body za týden, které server uzná: povedená kola z došlých statistik + 3 za každý den s povedeným kolem (dnešní úkol),
// nejvýš kolik hra hlásí (hra může podvádět jen do výše toho, co opravdu poslala jako odehraná kola)
export const allowedPoints = (claimed: number, rounds: number, days: number): number => Math.max(0, Math.min(claimed, rounds + 3 * Math.min(7, days)));
// uchovávání (31. 10. 2026): statistiky úloh 12 měsíců, hráč nepřihlášený 2 roky se smaže i se vším
export const EVENTS_KEEP_MS = 365 * 864e5, PLAYER_KEEP_MS = 730 * 864e5;
// které požadavky se počítají do přísnějšího limitu (zakládání): nový hráč, skupina, upozornění
export const isNewThing = (method: string, path: string): boolean => method === 'POST' && ['/api/players', '/api/group', '/api/push'].includes(path) || (method === 'PUT' && path === '/api/group');
export const MAX_EVENTS = 300;      // řádků statistik v jednom požadavku

// řádek žebříčku: body jen z tohoto týdne (starší týden = 0)
export interface Row { id: string; nick: string; week: string; week_points: number; summary: string }
export function leaderboardRows(rows: Row[], week: string, me = ''): { nick: string; points: number; summary: Summary; me: boolean }[] {
  // jen kdo tento týden hrál (0 bodů = staré a prázdné účty, Ondřej 2. 11. 2026), já vždy;
  // při stejných bodech jsem až za ostatními: o bod víc a jsem před nimi (motivace, Ondřej 2. 11. 2026)
  return rows.map(r => ({ nick: r.nick, points: r.week === week ? r.week_points : 0, summary: sanitizeSummary(safeJson(r.summary)), me: r.id === me }))
    .filter(r => r.points > 0 || r.me)
    .sort((a, b) => b.points - a.points || Number(a.me) - Number(b.me) || b.summary.total - a.summary.total);
}
export function safeJson(s: string | null | undefined): unknown { try { return JSON.parse(s || 'null'); } catch { return null; } }

// odkud smí hra volat API (nová adresa, stará na GitHub Pages kvůli přestěhování postupu, vývoj)
export const ORIGINS = ['https://schoolcraft.games', 'https://ondrej-kratochvil.github.io', 'http://127.0.0.1:4173', 'http://localhost:5173', 'http://127.0.0.1:8787'];

/* ---------- rozbory pro správce (Ondřej 3. 11. 2026: pravidelné rozbory Adamových a Víťových her) ---------- */
// Jen čtení a jen hráči rodinné skupiny (první skupina „Rodina“ z migrace 0004). Klíč je tajná proměnná ADMIN_TOKEN
// na Cloudflare (nasazuje ji CI z tajné proměnné GitHubu SCHOOLCRAFT_ADMIN_TOKEN), v repu ani v databázi není.
export const FAMILY_GROUP = 'Rodina';
export const ADMIN_MIN_LEN = 32;
export function adminToken(header: string | null): string | null {
  const m = /^Admin (\S+)$/.exec(header || '');
  return m && m[1].length >= ADMIN_MIN_LEN && m[1].length <= 200 ? m[1] : null;
}
export const validPlayerId = (x: unknown): x is string => typeof x === 'string' && /^[a-f0-9-]{36}$/.test(x);

// Aplikace pro Android v Google Play (Schoolcraft 11. 11. 2026, složka android/): Android otevře hru bez lišty Chromu,
// jen když web vyjmenuje otisky klíčů, kterými je aplikace podepsaná. Otisky jsou veřejné.
// 1. nahrávací klíč (soubor upload.p12 mimo repo, heslo v RoboFormu), 2. podpisový klíč Google Play (Play Console → Integrita aplikace).
export const ANDROID_PACKAGE = 'games.schoolcraft.app';
export const ANDROID_FINGERPRINTS = [
  'D7:E4:0B:29:34:CC:B0:49:21:C3:CD:3F:2A:B5:63:34:CF:D0:E4:C4:26:8E:DE:73:F2:FD:AE:40:4C:EA:51:34',
];
export const assetLinks = () => [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: ANDROID_FINGERPRINTS },
}];
