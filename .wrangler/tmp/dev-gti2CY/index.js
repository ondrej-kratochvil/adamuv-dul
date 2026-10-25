var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/logic.ts
function weekKey(d = /* @__PURE__ */ new Date(), tz = "Europe/Prague") {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(d).map((x) => [x.type, x.value]));
  const local = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  const dow = (local.getUTCDay() + 6) % 7;
  local.setUTCDate(local.getUTCDate() - dow);
  return local.toISOString().slice(0, 10);
}
__name(weekKey, "weekKey");
function sanitizeNick(x) {
  const s = typeof x === "string" ? x.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20) : "";
  return s || "Hr\xE1\u010D";
}
__name(sanitizeNick, "sanitizeNick");
var int = /* @__PURE__ */ __name((x, max) => typeof x === "number" && Number.isFinite(x) ? Math.max(0, Math.min(max, Math.round(x))) : 0, "int");
var id = /* @__PURE__ */ __name((x) => typeof x === "string" && /^[a-z0-9-]{1,24}$/.test(x) ? x : "", "id");
function sanitizeSummary(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const o = r.outfit && typeof r.outfit === "object" ? r.outfit : {};
  const outfit = {};
  for (const k of ["shirt", "pants", "shoes", "hat", "enchant"]) {
    const v = id(o[k]);
    if (v) outfit[k] = v;
  }
  return {
    outfit,
    total: int(r.total, 1e5),
    house: int(r.house, 12),
    farm: int(r.farm, 50),
    village: int(r.village, 20),
    pets: int(r.pets, 50),
    babies: int(r.babies, 50),
    streak: int(r.streak, 1e4),
    cards: int(r.cards, 1e4),
    dragon: int(r.dragon, 1e3),
    portal: r.portal === true
  };
}
__name(sanitizeSummary, "sanitizeSummary");
var MAX_SAVE = 15e5;
var MAX_EVENTS = 300;
function leaderboardRows(rows, week, me = "") {
  return rows.map((r) => ({ nick: r.nick, points: r.week === week ? r.week_points : 0, summary: sanitizeSummary(safeJson(r.summary)), me: r.id === me })).sort((a, b) => b.points - a.points || b.summary.total - a.summary.total);
}
__name(leaderboardRows, "leaderboardRows");
function safeJson(s) {
  try {
    return JSON.parse(s || "null");
  } catch {
    return null;
  }
}
__name(safeJson, "safeJson");
var ORIGINS = ["https://schoolcraft.games", "https://ondrej-kratochvil.github.io", "http://127.0.0.1:4173", "http://localhost:5173", "http://127.0.0.1:8787"];

// worker/index.ts
var hex = /* @__PURE__ */ __name((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""), "hex");
var sha = /* @__PURE__ */ __name(async (s) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), "sha");
function cors(req) {
  const o = req.headers.get("Origin") || "";
  return ORIGINS.includes(o) ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", Vary: "Origin" } : {};
}
__name(cors, "cors");
var json = /* @__PURE__ */ __name((req, body2, status = 200) => new Response(JSON.stringify(body2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(req) } }), "json");
async function auth(req, env) {
  const m = /^Bearer ([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(req.headers.get("Authorization") || "");
  if (!m) return null;
  const row = await env.DB.prepare("SELECT secret_hash FROM players WHERE id = ?").bind(m[1]).first();
  return row && row.secret_hash === await sha(m[2]) ? m[1] : null;
}
__name(auth, "auth");
async function body(req, max) {
  const t = await req.text();
  if (t.length > max) return null;
  const j = safeJson(t);
  return j && typeof j === "object" ? j : null;
}
__name(body, "body");
async function api(req, env, path) {
  const now = Date.now();
  if (path === "/api/players" && req.method === "POST") {
    const b = await body(req, 2e3);
    if (!b) return json(req, { error: "bad" }, 400);
    const id2 = crypto.randomUUID(), secret = hex(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare("INSERT INTO players (id, secret_hash, nick, public, created, updated) VALUES (?, ?, ?, ?, ?, ?)").bind(id2, await sha(secret), sanitizeNick(b.nick), b.public === false ? 0 : 1, now, now).run();
    return json(req, { id: id2, secret });
  }
  if (path === "/api/leaderboard" && req.method === "GET") {
    const me2 = await auth(req, env), week = weekKey();
    const r = await env.DB.prepare("SELECT id, nick, week, week_points, summary FROM players WHERE public = 1 OR id = ? ORDER BY (week = ?) DESC, week_points DESC, updated DESC LIMIT 100").bind(me2 || "", week).all();
    return json(req, { week, players: leaderboardRows(r.results, week, me2 || "") });
  }
  const me = await auth(req, env);
  if (!me) return json(req, { error: "auth" }, 401);
  if (path === "/api/me" && req.method === "PUT") {
    const b = await body(req, MAX_SAVE + 2e4);
    if (!b) return json(req, { error: "bad" }, 400);
    const week = typeof b.week === "string" && /^\d{4}-\d\d-\d\d$/.test(b.week) ? b.week : weekKey();
    const pts = typeof b.weekPoints === "number" ? Math.max(0, Math.min(1e3, Math.round(b.weekPoints))) : 0;
    const save = b.save === void 0 ? null : JSON.stringify(b.save);
    if (save && save.length > MAX_SAVE) return json(req, { error: "save too big" }, 413);
    await env.DB.prepare(`UPDATE players SET nick = ?, public = ?, week = ?, week_points = ?, summary = ?, updated = ?${save ? ", save = ?, save_updated = ?" : ""} WHERE id = ?`).bind(...[sanitizeNick(b.nick), b.public === false ? 0 : 1, week, pts, JSON.stringify(sanitizeSummary(b.summary)), now, ...save ? [save, now] : [], me]).run();
    return json(req, { ok: true });
  }
  if (path === "/api/me/save" && req.method === "GET") {
    const r = await env.DB.prepare("SELECT nick, save, save_updated FROM players WHERE id = ?").bind(me).first();
    return json(req, { nick: r?.nick, save: safeJson(r?.save), updated: r?.save_updated || 0 });
  }
  if (path === "/api/events" && req.method === "POST") {
    const b = await body(req, 6e5);
    const rows = b && Array.isArray(b.rows) ? b.rows.slice(0, MAX_EVENTS) : null;
    if (!rows) return json(req, { error: "bad" }, 400);
    const st = rows.filter((r) => r && typeof r === "object").map((r) => {
      const o = r;
      return env.DB.prepare("INSERT INTO events (player_id, ts, kind, data) VALUES (?, ?, ?, ?)").bind(me, now, String(o.Druh || "").slice(0, 30), JSON.stringify(o).slice(0, 4e3));
    });
    if (st.length) await env.DB.batch(st);
    return json(req, { ok: true, n: st.length });
  }
  if (path === "/api/me" && req.method === "DELETE") {
    await env.DB.batch([env.DB.prepare("DELETE FROM events WHERE player_id = ?").bind(me), env.DB.prepare("DELETE FROM players WHERE id = ?").bind(me)]);
    return json(req, { ok: true });
  }
  return json(req, { error: "not found" }, 404);
}
__name(api, "api");
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
      try {
        return await api(req, env, url.pathname);
      } catch (e) {
        return json(req, { error: "server" }, 500);
      }
    }
    return env.ASSETS.fetch(req);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body2 = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body2);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body2, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-z031t1/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-z031t1/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
