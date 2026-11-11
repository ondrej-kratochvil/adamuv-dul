// Schoolcraft na Cloudflare Workers: hra (statické soubory z dist) a API pro postup, statistiky a žebříček.
// Databáze D1 (binding DB) je v EU. Hráč se přihlašuje „id.tajemstvi“ (Authorization: Bearer …), v databázi je jen otisk tajemství.
import { NEWS_MS, dueSubs, makeVapid, overtaken, pragueNow, rankText, rankTime, sendPush, validEndpoint, validHour, validKey, type RankRow, type Vapid } from './push';
import { EXPORT_PAGE, validKind } from '../src/logic/stats-export';
import { ADMIN_MIN_LEN, FAMILY_GROUP, adminToken, assetLinks, validPlayerId } from './logic';
import { TTS_DAY_CHARS, TTS_MONTH_CHARS, capNum, gameText, googleBody, ttsKey, ttsQuery, type TtsQuery } from '../src/logic/tts';
import { EVENTS_KEEP_MS, allowedPoints, sanitizeGroupName, validGroupCode, isNewThing, leaderboardRows, MAX_EVENTS, MAX_SAVE, ORIGINS, PLAYER_KEEP_MS, safeJson, sanitizeNick, sanitizeSummary, weekKey, type Row } from './logic';

interface D1Result<T> { results: T[] }
interface D1Stmt { bind(...v: unknown[]): D1Stmt; first<T>(): Promise<T | null>; all<T>(): Promise<D1Result<T>>; run(): Promise<unknown> }
interface D1 { prepare(sql: string): D1Stmt; batch(s: D1Stmt[]): Promise<unknown> }
interface Limiter { limit(o: { key: string }): Promise<{ success: boolean }> }
interface Env { DB: D1; ASSETS: { fetch(r: Request): Promise<Response> }; RL_API?: Limiter; RL_NEW?: Limiter; RL_TTS?: Limiter; RL_TTS_NEW?: Limiter; ADMIN_TOKEN?: string; GOOGLE_TTS_KEY?: string; TTS_DAY_CHARS?: string; TTS_MONTH_CHARS?: string }
interface Ctx { waitUntil(p: Promise<unknown>): void }

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha = async (s: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

function cors(req: Request): Record<string, string> {
  const o = req.headers.get('Origin') || '';
  return ORIGINS.includes(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', Vary: 'Origin' } : {};
}
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...cors(req) } });
// omezení počtu požadavků (wrangler.jsonc ratelimits); bez vazby (lokální testy) se nepočítá
async function limited(rl: Limiter | undefined, key: string): Promise<boolean> { if (!rl) return false; try { return !(await rl.limit({ key })).success; } catch { return false; } }

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

// rozbory pro správce: jen čtení, jen rodinná skupina (worker/logic.ts FAMILY_GROUP), klíč v tajné proměnné ADMIN_TOKEN
async function admin(req: Request, env: Env, path: string): Promise<Response> {
  const t = adminToken(req.headers.get('Authorization'));
  if (!t || !env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < ADMIN_MIN_LEN || await sha(t) !== await sha(env.ADMIN_TOKEN)) return json(req, { error: 'auth' }, 401);
  if (req.method !== 'GET') return json(req, { error: 'read only' }, 405);
  if (path === '/api/admin/tts') {
    const r = await env.DB.prepare('SELECT day, chars, calls, refused FROM tts_usage ORDER BY day DESC LIMIT 62').all<Record<string, unknown>>();
    const n = await env.DB.prepare('SELECT COUNT(*) AS sentences, COALESCE(SUM(chars), 0) AS chars FROM tts_audio').first<Record<string, unknown>>();
    return json(req, { caps: { day: capNum(env.TTS_DAY_CHARS, TTS_DAY_CHARS), month: capNum(env.TTS_MONTH_CHARS, TTS_MONTH_CHARS) }, stored: n, days: r.results });
  }
  const g = await env.DB.prepare('SELECT code FROM groups WHERE name = ? ORDER BY created LIMIT 1').bind(FAMILY_GROUP).first<{ code: string }>();
  if (!g) return json(req, { players: [] });
  if (path === '/api/admin/players') {
    const r = await env.DB.prepare(`SELECT id, nick, week, week_points, updated, summary, (SELECT COUNT(*) FROM events WHERE player_id = players.id) AS events, (SELECT MAX(ts) FROM events WHERE player_id = players.id) AS last_event FROM players WHERE group_code = ? ORDER BY last_event DESC`).bind(g.code).all<Record<string, unknown>>();
    return json(req, { players: r.results.map(p => ({ ...p, summary: safeJson(p.summary as string) })) });
  }
  if (path === '/api/admin/events') {
    const q = new URL(req.url).searchParams, player = q.get('player'), kind = q.get('kind') || '', after = Math.max(0, parseInt(q.get('after') || '0', 10) || 0);
    if (!validPlayerId(player) || !validKind(kind)) return json(req, { error: 'bad' }, 400);
    const inGroup = await env.DB.prepare('SELECT 1 AS x FROM players WHERE id = ? AND group_code = ?').bind(player, g.code).first();
    if (!inGroup) return json(req, { error: 'not in family group' }, 403);
    const r = await env.DB.prepare('SELECT id, ts, data FROM events WHERE player_id = ? AND kind = ? AND id > ? ORDER BY id LIMIT ?').bind(player, kind, after, EXPORT_PAGE).all<{ id: number; ts: number; data: string }>();
    const last = r.results.at(-1);
    return json(req, { rows: r.results.map(x => safeJson(x.data)).filter(x => x && typeof x === 'object'), next: r.results.length === EXPORT_PAGE && last ? last.id : 0 });
  }
  return json(req, { error: 'not found' }, 404);
}

// přirozený hlas (src/logic/tts.ts): Google Cloud Text-to-Speech, klíč v tajné proměnné GOOGLE_TTS_KEY.
// Pojistky (Honza 9. 11. 2026): jen věty ze hry, hotové MP3 sdílené všemi hráči (D1 tts_audio + mezipaměť Cloudflare),
// denní a měsíční strop znaků (tts_usage), limit požadavků na IP (RL_TTS všechny, RL_TTS_NEW nové věty). Po stropu čte hlas tabletu.
const edgeCache = (): Cache | null => (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default || null;
async function googleTts(q: TtsQuery, key: string): Promise<Uint8Array | null> {
  const call = (b: Record<string, unknown>) => fetch('https://texttospeech.googleapis.com/v1/text:synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Goog-Api-Key': key }, body: JSON.stringify(b) });
  let r = await call(googleBody(q));
  if (r.status === 400 && q.rate !== 1) r = await call(googleBody({ ...q, rate: 1 })); // hlas bez nastavení rychlosti
  if (!r.ok) { console.log('tts google', r.status, (await r.text()).slice(0, 200)); return null; }
  const j = await r.json() as { audioContent?: string };
  if (!j.audioContent) return null;
  return Uint8Array.from(atob(j.audioContent), c => c.charCodeAt(0));
}
// rezervace znaků pod stropem (jedním příkazem, aby dva požadavky naráz strop nepřelezly)
async function reserveChars(env: Env, n: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10), dayCap = capNum(env.TTS_DAY_CHARS, TTS_DAY_CHARS), monthCap = capNum(env.TTS_MONTH_CHARS, TTS_MONTH_CHARS);
  await env.DB.prepare('INSERT OR IGNORE INTO tts_usage (day) VALUES (?)').bind(day).run();
  const r = await env.DB.prepare('UPDATE tts_usage SET chars = chars + ?1, calls = calls + 1 WHERE day = ?2 AND chars + ?1 <= ?3 AND (SELECT COALESCE(SUM(chars), 0) FROM tts_usage WHERE day LIKE ?4) + ?1 <= ?5')
    .bind(n, day, dayCap, day.slice(0, 8) + '%', monthCap).run() as { meta?: { changes?: number } };
  if (r.meta?.changes) return true;
  await env.DB.prepare('UPDATE tts_usage SET refused = refused + 1 WHERE day = ?').bind(day).run();
  return false;
}
async function tts(req: Request, env: Env, ctx: Ctx, ip: string): Promise<Response> {
  if (await limited(env.RL_TTS, 'ip:' + ip)) return json(req, { error: 'too many' }, 429);
  const q = ttsQuery(await body(req, 3000));
  if (!q) return json(req, { error: 'bad' }, 400);
  if (!gameText(q.text)) return json(req, { error: 'not game text' }, 422);
  if (!env.GOOGLE_TTS_KEY) return json(req, { error: 'tts off' }, 503);
  const id = await sha(ttsKey(q)), cache = edgeCache(), key = new Request('https://schoolcraft.games/tts-cache/' + id);
  const mp3Response = (mp3: ArrayBuffer | Uint8Array) => new Response(mp3, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=31536000', 'X-Content-Type-Options': 'nosniff', ...cors(req) } });
  const toEdge = (mp3: ArrayBuffer | Uint8Array) => { if (cache) ctx.waitUntil(cache.put(key, new Response(mp3, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' } }))); };
  const hit = cache ? await cache.match(key) : undefined;
  if (hit) return mp3Response(await hit.arrayBuffer());
  const row = await env.DB.prepare('SELECT mp3 FROM tts_audio WHERE key = ?').bind(id).first<{ mp3: ArrayBuffer | number[] }>();
  if (row) { const mp3 = row.mp3 instanceof ArrayBuffer ? row.mp3 : new Uint8Array(row.mp3); toEdge(mp3); return mp3Response(mp3); }
  if (await limited(env.RL_TTS_NEW, 'ip:' + ip)) return json(req, { error: 'too many' }, 429);
  if (!await reserveChars(env, q.text.length)) return json(req, { error: 'cap' }, 429);
  const mp3 = await googleTts(q, env.GOOGLE_TTS_KEY);
  if (!mp3) return json(req, { error: 'tts provider' }, 502);
  ctx.waitUntil(env.DB.prepare('INSERT OR IGNORE INTO tts_audio (key, mp3, chars, created) VALUES (?, ?, ?, ?)').bind(id, mp3, q.text.length, Date.now()).run());
  toEdge(mp3);
  return mp3Response(mp3);
}

async function api(req: Request, env: Env, path: string, ctx: Ctx): Promise<Response> {
  const now = Date.now();
  const ip = req.headers.get('CF-Connecting-IP') || 'local', who = /^Bearer ([a-f0-9-]{36})\./.exec(req.headers.get('Authorization') || '');
  if (path === '/api/tts' && req.method === 'POST') return tts(req, env, ctx, ip);
  if (isNewThing(req.method, path) && await limited(env.RL_NEW, 'ip:' + ip)) return json(req, { error: 'too many' }, 429);
  if (await limited(env.RL_API, who ? 'p:' + who[1] : 'ip:' + ip)) return json(req, { error: 'too many' }, 429);
  if (path.startsWith('/api/admin/')) return admin(req, env, path);
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
    await env.DB.prepare('INSERT INTO push_subs (endpoint, p256dh, auth, hour, player_id, created, rank) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, hour = excluded.hour, player_id = excluded.player_id, rank = excluded.rank, fails = 0')
      .bind(endpoint, validKey(k.p256dh, 65) || '', validKey(k.auth, 16) || '', validHour(b!.hour), await auth(req, env), now, b!.rank === true ? 1 : 0).run();
    return json(req, { ok: true });
  }
  // service worker po prázdné zprávě: čeká tu text (předběhnutí v žebříčku)? Jinak {} a zobrazí ranní text
  if (path === '/api/push/news' && req.method === 'POST') {
    const b = await body(req, 2000), endpoint = b && validEndpoint(b.endpoint);
    if (!endpoint) return json(req, {});
    const r = await env.DB.prepare('SELECT news, news_t FROM push_subs WHERE endpoint = ?').bind(endpoint).first<{ news: string; news_t: number }>();
    if (!r || !r.news || now - r.news_t > NEWS_MS) return json(req, {});
    await env.DB.prepare("UPDATE push_subs SET news = '' WHERE endpoint = ?").bind(endpoint).run();
    return json(req, safeJson(r.news) || {});
  }
  if (path === '/api/push' && req.method === 'DELETE') {
    const b = await body(req, 2000), endpoint = b && validEndpoint(b.endpoint);
    if (!endpoint) return json(req, { error: 'bad' }, 400);
    await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(endpoint).run();
    return json(req, { ok: true });
  }
  // žebříček jen ve skupině (rodina, třída); bez skupiny jen já
  if (path === '/api/leaderboard' && req.method === 'GET') {
    const me = await auth(req, env), week = weekKey();
    if (!me) return json(req, { week, group: null, players: [] });
    const g = await myGroup(env, me);
    const r = g
      ? await env.DB.prepare('SELECT id, nick, week, week_points, summary FROM players WHERE group_code = ? AND (public = 1 OR id = ?) ORDER BY (week = ?) DESC, week_points DESC, updated DESC LIMIT 100').bind(g.code, me, week).all<Row>()
      : await env.DB.prepare('SELECT id, nick, week, week_points, summary FROM players WHERE id = ?').bind(me).all<Row>();
    return json(req, { week, group: g ? { name: g.name } : null, players: leaderboardRows(r.results, week, me) });
  }
  const me = await auth(req, env);
  if (!me) return json(req, { error: 'auth' }, 401);
  // souhrn pro žebříček a záloha postupu
  if (path === '/api/me' && req.method === 'PUT') {
    const b = await body(req, MAX_SAVE + 20000); if (!b) return json(req, { error: 'bad' }, 400);
    const week = typeof b.week === 'string' && /^\d{4}-\d\d-\d\d$/.test(b.week) ? b.week : weekKey();
    let pts = typeof b.weekPoints === 'number' ? Math.max(0, Math.min(1000, Math.round(b.weekPoints))) : 0;
    const save = b.save === undefined ? null : JSON.stringify(b.save);
    if (save && save.length > MAX_SAVE) return json(req, { error: 'save too big' }, 413);
    // body: server uzná nejvýš tolik, kolik odpovídá poslaným povedeným kolům tohoto týdne (hra posílá statistiky před souhrnem)
    if (week === weekKey()) {
      const since = Date.parse(week + 'T00:00:00Z') - 2 * 3600_000; // pondělí 0:00 v Praze (s rezervou na letní čas)
      const c = await env.DB.prepare(`SELECT COUNT(*) AS n, COUNT(DISTINCT date(ts / 1000, 'unixepoch')) AS d FROM events WHERE player_id = ? AND kind = 'kolo' AND ts >= ? AND json_extract(data, '$."Povedené"') = 'ano' AND json_extract(data, '$."Odešel"') = 'ne' AND json_extract(data, '$."Dodatečně"') IS NULL`).bind(me, since).first<{ n: number; d: number }>();
      pts = allowedPoints(pts, c ? c.n : 0, c ? c.d : 0);
    }
    const old = await env.DB.prepare('SELECT week, week_points FROM players WHERE id = ?').bind(me).first<{ week: string; week_points: number }>();
    const nick = sanitizeNick(b.nick), pub = b.public === false ? 0 : 1;
    await env.DB.prepare(`UPDATE players SET nick = ?, public = ?, week = ?, week_points = ?, summary = ?, updated = ?${save ? ', save = ?, save_updated = ?' : ''} WHERE id = ?`)
      .bind(...[nick, pub, week, pts, JSON.stringify(sanitizeSummary(b.summary)), now, ...(save ? [save, now] : []), me]).run();
    // předběhl někoho v žebříčku? (jen veřejný hráč, tento týden)
    if (pub && week === weekKey()) ctx.waitUntil(rankNotify(env, me, nick, week, old && old.week === week ? old.week_points : 0, pts).catch(() => {}));
    return json(req, { ok: true });
  }
  // nastavení hráče pro kartu Online: skupina
  if (path === '/api/me' && req.method === 'GET') {
    const r = await env.DB.prepare('SELECT nick, public FROM players WHERE id = ?').bind(me).first<{ nick: string; public: number }>();
    const g = await myGroup(env, me);
    return json(req, { nick: r?.nick, public: r?.public === 1, group: g });
  }
  // skupina: založit (s kódem pozvánky), vstoupit kódem, opustit
  if (path === '/api/group' && req.method === 'POST') {
    const b = await body(req, 1000); const name = sanitizeGroupName(b && b.name), code = hex(crypto.getRandomValues(new Uint8Array(6)));
    await env.DB.batch([env.DB.prepare('INSERT INTO groups (code, name, created) VALUES (?, ?, ?)').bind(code, name, now), env.DB.prepare('UPDATE players SET group_code = ? WHERE id = ?').bind(code, me)]);
    return json(req, { code, name });
  }
  if (path === '/api/group' && req.method === 'PUT') {
    const b = await body(req, 1000), code = validGroupCode(b && b.code);
    const g = code ? await env.DB.prepare('SELECT code, name FROM groups WHERE code = ?').bind(code).first<{ code: string; name: string }>() : null;
    if (!g) return json(req, { error: 'no group' }, 404);
    await env.DB.prepare('UPDATE players SET group_code = ? WHERE id = ?').bind(g.code, me).run();
    return json(req, g);
  }
  if (path === '/api/group' && req.method === 'DELETE') {
    await env.DB.prepare("UPDATE players SET group_code = '' WHERE id = ?").bind(me).run();
    return json(req, { ok: true });
  }
  // nový kód hráče (starý přestane platit, třeba když unikl)
  if (path === '/api/me/secret' && req.method === 'POST') {
    const secret = hex(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare('UPDATE players SET secret_hash = ? WHERE id = ?').bind(await sha(secret), me).run();
    return json(req, { id: me, secret });
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
      return env.DB.prepare('INSERT OR IGNORE INTO events (player_id, ts, kind, data) VALUES (?, ?, ?, ?)') // znovu poslaná dávka: stejný řádek jen jednou (migrace 0007)
        .bind(me, now, String(o.Druh || '').slice(0, 30), JSON.stringify(o).slice(0, 4000));
    });
    if (st.length) await env.DB.batch(st);
    return json(req, { ok: true, n: st.length });
  }
  // stažení vlastních statistik (rodič v nastavení, část Statistiky); po stránkách podle id, jen jeden druh
  if (path === '/api/me/events' && req.method === 'GET') {
    const q = new URL(req.url).searchParams, kind = q.get('kind') || '', after = Math.max(0, parseInt(q.get('after') || '0', 10) || 0);
    if (!validKind(kind)) return json(req, { error: 'bad' }, 400);
    const r = await env.DB.prepare('SELECT id, data FROM events WHERE player_id = ? AND kind = ? AND id > ? ORDER BY id LIMIT ?').bind(me, kind, after, EXPORT_PAGE).all<{ id: number; data: string }>();
    const rows = r.results.map(x => safeJson(x.data)).filter(x => x && typeof x === 'object');
    const last = r.results.at(-1);
    return json(req, { rows, next: r.results.length === EXPORT_PAGE && last ? last.id : 0 });
  }
  // smazat hráče i statistiky (rodič v nastavení)
  if (path === '/api/me' && req.method === 'DELETE') {
    await env.DB.batch([env.DB.prepare('DELETE FROM events WHERE player_id = ?').bind(me), env.DB.prepare('DELETE FROM push_subs WHERE player_id = ?').bind(me), env.DB.prepare('DELETE FROM players WHERE id = ?').bind(me)]);
    return json(req, { ok: true });
  }
  return json(req, { error: 'not found' }, 404);
}

// skupina hráče (kód a název), nebo null
async function myGroup(env: Env, me: string): Promise<{ code: string; name: string } | null> {
  return env.DB.prepare("SELECT g.code, g.name FROM players p JOIN groups g ON g.code = p.group_code WHERE p.id = ? AND p.group_code != ''").bind(me).first<{ code: string; name: string }>();
}
const MAX_SUBS = 20000; // pojistka proti zahlcení (zakládání hlídá i RL_NEW podle IP)
// klíč serveru pro podpis upozornění: vytvoří se při prvním použití a zůstane v databázi (nikde jinde není)
let vapidCache: Vapid | null = null;
async function vapid(env: Env): Promise<Vapid> {
  if (vapidCache) return vapidCache;
  const read = async () => { const r = await env.DB.prepare("SELECT value FROM config WHERE key = 'vapid'").first<{ value: string }>(); return r ? JSON.parse(r.value) as Vapid : null; };
  let v = await read();
  if (!v) { await env.DB.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('vapid', ?)").bind(JSON.stringify(await makeVapid())).run(); v = await read(); }
  return vapidCache = v!;
}
// předběhnutí v žebříčku: upozornit předběhnuté hráče, kteří to chtějí (přes den, nejvýš jednou denně)
async function rankNotify(env: Env, me: string, nick: string, week: string, before: number, after: number): Promise<void> {
  if (after <= before) return;
  const now = pragueNow(); if (!rankTime(now.hour)) return;
  const g = await myGroup(env, me); if (!g) return; // jen ve skupině: cizí hráč dětem nic poslat nemůže
  const r = await env.DB.prepare('SELECT id, week, week_points, public FROM players WHERE group_code = ? AND week = ? AND public = 1 AND week_points >= ? AND week_points < ? AND id != ? LIMIT 50').bind(g.code, week, before, after, me).all<RankRow>();
  const ids = overtaken(r.results, me, week, before, after); if (!ids.length) return;
  const subs = await env.DB.prepare(`SELECT endpoint FROM push_subs WHERE rank = 1 AND rank_day != ? AND player_id IN (${ids.map(() => '?').join(',')})`).bind(now.day, ...ids).all<{ endpoint: string }>();
  if (!subs.results.length) return;
  const v = await vapid(env), news = JSON.stringify(rankText(nick)), t = Date.now();
  for (const s of subs.results) {
    await env.DB.prepare('UPDATE push_subs SET rank_day = ?, news = ?, news_t = ? WHERE endpoint = ?').bind(now.day, news, t, s.endpoint).run();
    if (await sendPush(s.endpoint, v) === 'gone') await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(s.endpoint).run();
  }
}
// každou celou hodinu (wrangler.jsonc triggers): upozornění zařízením, která chtějí tuhle hodinu českého času
async function morning(env: Env): Promise<void> {
  const now = pragueNow();
  const r = await env.DB.prepare('SELECT endpoint, hour, last_day, fails FROM push_subs WHERE hour = ? AND last_day != ? LIMIT 1000').bind(now.hour, now.day).all<{ endpoint: string; hour: number; last_day: string; fails: number }>();
  const due = dueSubs(r.results, now);
  if (!due.length) return;
  const v = await vapid(env);
  for (const s of due) {
    await env.DB.prepare("UPDATE push_subs SET news = '' WHERE endpoint = ?").bind(s.endpoint).run(); // ranní zpráva: service worker ukáže ranní text
    const res = await sendPush(s.endpoint, v);
    if (res === 'gone' || (res === 'fail' && s.fails >= 9)) await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(s.endpoint).run();
    else await env.DB.prepare("UPDATE push_subs SET last_day = ?, fails = ?, news = '' WHERE endpoint = ?").bind(now.day, res === 'ok' ? 0 : s.fails + 1, s.endpoint).run(); // ranní: žádný starý text
  }
}

// uchovávání (jednou denně ve 3 h): staré statistiky a dlouho nepřihlášení hráči pryč
async function cleanup(env: Env): Promise<void> {
  if (pragueNow().hour !== 3) return;
  const now = Date.now();
  await env.DB.prepare('DELETE FROM events WHERE ts < ?').bind(now - EVENTS_KEEP_MS).run();
  const old = await env.DB.prepare('SELECT id FROM players WHERE updated < ? LIMIT 200').bind(now - PLAYER_KEEP_MS).all<{ id: string }>();
  for (const p of old.results) await env.DB.batch([env.DB.prepare('DELETE FROM events WHERE player_id = ?').bind(p.id), env.DB.prepare('DELETE FROM push_subs WHERE player_id = ?').bind(p.id), env.DB.prepare('DELETE FROM players WHERE id = ?').bind(p.id)]);
}

export default {
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> { ctx.waitUntil(morning(env)); ctx.waitUntil(cleanup(env).catch(() => {})); },
  async fetch(req: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
      try { return await api(req, env, url.pathname, ctx); } catch (e) { return json(req, { error: 'server' }, 500); }
    }
    if (url.pathname === '/.well-known/assetlinks.json') return new Response(JSON.stringify(assetLinks()), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
    return env.ASSETS.fetch(req);
  },
};
