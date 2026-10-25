// Schoolcraft na Cloudflare Workers: hra (statické soubory z dist) a API pro postup, statistiky a žebříček.
// Databáze D1 (binding DB) je v EU. Hráč se přihlašuje „id.tajemstvi“ (Authorization: Bearer …), v databázi je jen otisk tajemství.
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
    await env.DB.batch([env.DB.prepare('DELETE FROM events WHERE player_id = ?').bind(me), env.DB.prepare('DELETE FROM players WHERE id = ?').bind(me)]);
    return json(req, { ok: true });
  }
  return json(req, { error: 'not found' }, 404);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
      try { return await api(req, env, url.pathname); } catch (e) { return json(req, { error: 'server' }, 500); }
    }
    return env.ASSETS.fetch(req);
  },
};
