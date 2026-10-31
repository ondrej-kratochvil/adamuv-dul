// Schoolcraft na Cloudflare Workers: hra (statické soubory z dist) a API pro postup, statistiky a žebříček.
// Databáze D1 (binding DB) je v EU. Hráč se přihlašuje „id.tajemstvi“ (Authorization: Bearer …), v databázi je jen otisk tajemství.
import { dueSubs, makeVapid, pragueNow, sendPush, validEndpoint, validHour, validKey, type Vapid } from './push';
import { leaderboardRows, MAX_EVENTS, MAX_SAVE, ORIGINS, safeJson, sanitizeNick, sanitizeSummary, weekKey, type Row } from './logic';

interface D1Result<T> { results: T[] }
interface D1Stmt { bind(...v: unknown[]): D1Stmt; first<T>(): Promise<T | null>; all<T>(): Promise<D1Result<T>>; run(): Promise<unknown> }
interface D1 { prepare(sql: string): D1Stmt; batch(s: D1Stmt[]): Promise<unknown> }
interface Env { DB: D1; ASSETS: { fetch(r: Request): Promise<Response> } }

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha = async (s: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

function cors(req: Request): Record<string, string> {
  const o = req.headers.get('Origin') || '';
  return ORIGINS.includes(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', Vary: 'Origin' } : {};
}
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req) } });

// přihlášený hráč z hlavičky, nebo null
async function auth(req: Request, env: Env): Promise<string | null> {
  const m = /^Bearer ([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const row = await env.DB.prepare('SELECT secret_hash FROM players WHERE id = ?').bind(m[1]).first<{ secret_hash: string }>();
  return row && row.secret_hash === await sha(m[2]) ? m[1] : null;
}
async function body(req: Request, max: number): Promise<Record<string, unknown> | null> {
  const t = await req.text();
  if (t.length > max) return null;
  const j = safeJson(t);
  return j && typeof j === 'object' ? j as Record<string, unknown> : null;
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  const now = Date.now();
  // nový hráč: vrátí id a tajemství (hra si je uloží; v databázi jen otisk)
  if (path === '/api/players' && req.method === 'POST') {
    const b = await body(req, 2000); if (!b) return json(req, { error: 'bad' }, 400);
    const id = crypto.randomUUID(), secret = hex(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare('INSERT INTO players (id, secret_hash, nick, public, created, updated) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, await sha(secret), sanitizeNick(b.nick), b.public === false ? 0 : 1, now, now).run();
    return json(req, { id, secret });
  }
  // ranní upozornění (worker/push.ts): veřejný klíč serveru, přihlášení a odhlášení zařízení (i bez online hráče)
  if (path === '/api/push/key' && req.method === 'GET') return json(req, { key: (await vapid(env)).publicKey });
  if (path === '/api/push' && req.method === 'POST') {
    const b = await body(req, 3000), k = (b && b.keys && typeof b.keys === 'object' ? b.keys : {}) as Record<string, unknown>;
    const endpoint = b && validEndpoint(b.endpoint);
    if (!endpoint) return json(req, { error: 'bad' }, 400);
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM push_subs').first<{ n: number }>();
    if (n && n.n >= MAX_SUBS) return json(req, { error: 'full' }, 503);
    await env.DB.prepare('INSERT INTO push_subs (endpoint, p256dh, auth, hour, player_id, created) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, hour = excluded.hour, player_id = excluded.player_id, fails = 0')
      .bind(endpoint, validKey(k.p256dh, 65) || '', validKey(k.auth, 16) || '', validHour(b!.hour), await auth(req, env), now).run();
    return json(req, { ok: true });
  }
  if (path === '/api/push' && req.method === 'DELETE') {
    const b = await body(req, 2000), endpoint = b && validEndpoint(b.endpoint);
    if (!endpoint) return json(req, { error: 'bad' }, 400);
    await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(endpoint).run();
    return json(req, { ok: true });
  }
  if (path === '/api/leaderboard' && req.method === 'GET') {
    const me = await auth(req, env), week = weekKey();
    const r = await env.DB.prepare('SELECT id, nick, week, week_points, summary FROM players WHERE public = 1 OR id = ? ORDER BY (week = ?) DESC, week_points DESC, updated DESC LIMIT 100').bind(me || '', week).all<Row>();
    return json(req, { week, players: leaderboardRows(r.results, week, me || '') });
  }
  const me = await auth(req, env);
  if (!me) return json(req, { error: 'auth' }, 401);
  // souhrn pro žebříček a záloha postupu
  if (path === '/api/me' && req.method === 'PUT') {
    const b = await body(req, MAX_SAVE + 20000); if (!b) return json(req, { error: 'bad' }, 400);
    const week = typeof b.week === 'string' && /^\d{4}-\d\d-\d\d$/.test(b.week) ? b.week : weekKey();
    const pts = typeof b.weekPoints === 'number' ? Math.max(0, Math.min(1000, Math.round(b.weekPoints))) : 0;
    const save = b.save === undefined ? null : JSON.stringify(b.save);
    if (save && save.length > MAX_SAVE) return json(req, { error: 'save too big' }, 413);
    await env.DB.prepare(`UPDATE players SET nick = ?, public = ?, week = ?, week_points = ?, summary = ?, updated = ?${save ? ', save = ?, save_updated = ?' : ''} WHERE id = ?`)
      .bind(...[sanitizeNick(b.nick), b.public === false ? 0 : 1, week, pts, JSON.stringify(sanitizeSummary(b.summary)), now, ...(save ? [save, now] : []), me]).run();
    return json(req, { ok: true });
  }
  if (path === '/api/me/save' && req.method === 'GET') {
    const r = await env.DB.prepare('SELECT nick, save, save_updated FROM players WHERE id = ?').bind(me).first<{ nick: string; save: string | null; save_updated: number | null }>();
    return json(req, { nick: r?.nick, save: safeJson(r?.save), updated: r?.save_updated || 0 });
  }
  // statistiky (stejné řádky jako do tabulky Google)
  if (path === '/api/events' && req.method === 'POST') {
    const b = await body(req, 600000); const rows = b && Array.isArray(b.rows) ? b.rows.slice(0, MAX_EVENTS) : null;
    if (!rows) return json(req, { error: 'bad' }, 400);
    const st = rows.filter(r => r && typeof r === 'object').map(r => {
      const o = r as Record<string, unknown>;
      return env.DB.prepare('INSERT INTO events (player_id, ts, kind, data) VALUES (?, ?, ?, ?)').bind(me, now, String(o.Druh || '').slice(0, 30), JSON.stringify(o).slice(0, 4000));
    });
    if (st.length) await env.DB.batch(st);
    return json(req, { ok: true, n: st.length });
  }
  // smazat hráče i statistiky (rodič v nastavení)
  if (path === '/api/me' && req.method === 'DELETE') {
    await env.DB.batch([env.DB.prepare('DELETE FROM events WHERE player_id = ?').bind(me), env.DB.prepare('DELETE FROM push_subs WHERE player_id = ?').bind(me), env.DB.prepare('DELETE FROM players WHERE id = ?').bind(me)]);
    return json(req, { ok: true });
  }
  return json(req, { error: 'not found' }, 404);
}

const MAX_SUBS = 5000; // pojistka proti zahlcení
// klíč serveru pro podpis upozornění: vytvoří se při prvním použití a zůstane v databázi (nikde jinde není)
let vapidCache: Vapid | null = null;
async function vapid(env: Env): Promise<Vapid> {
  if (vapidCache) return vapidCache;
  const read = async () => { const r = await env.DB.prepare("SELECT value FROM config WHERE key = 'vapid'").first<{ value: string }>(); return r ? JSON.parse(r.value) as Vapid : null; };
  let v = await read();
  if (!v) { await env.DB.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('vapid', ?)").bind(JSON.stringify(await makeVapid())).run(); v = await read(); }
  return vapidCache = v!;
}
// každou celou hodinu (wrangler.jsonc triggers): upozornění zařízením, která chtějí tuhle hodinu českého času
async function morning(env: Env): Promise<void> {
  const now = pragueNow();
  const r = await env.DB.prepare('SELECT endpoint, hour, last_day, fails FROM push_subs WHERE hour = ? AND last_day != ? LIMIT 1000').bind(now.hour, now.day).all<{ endpoint: string; hour: number; last_day: string; fails: number }>();
  const due = dueSubs(r.results, now);
  if (!due.length) return;
  const v = await vapid(env);
  for (const s of due) {
    const res = await sendPush(s.endpoint, v);
    if (res === 'gone' || (res === 'fail' && s.fails >= 9)) await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(s.endpoint).run();
    else await env.DB.prepare('UPDATE push_subs SET last_day = ?, fails = ? WHERE endpoint = ?').bind(now.day, res === 'ok' ? 0 : s.fails + 1, s.endpoint).run();
  }
}

export default {
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> { ctx.waitUntil(morning(env)); },
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
      try { return await api(req, env, url.pathname); } catch (e) { return json(req, { error: 'server' }, 500); }
    }
    return env.ASSETS.fetch(req);
  },
};
