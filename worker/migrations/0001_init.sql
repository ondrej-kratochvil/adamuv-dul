-- Schoolcraft: hráči, záloha postupu, souhrn pro žebříček a statistiky (25. 10. 2026)
-- Data v EU (D1 jurisdiction eu). Hráč = zařízení/profil; přihlašuje se tajným klíčem, v databázi je jen jeho otisk (SHA-256).
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  nick TEXT NOT NULL,
  public INTEGER NOT NULL DEFAULT 1,      -- 1 = v žebříčku
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  week TEXT NOT NULL DEFAULT '',          -- pondělí týdne (RRRR-MM-DD), ke kterému patří week_points
  week_points INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL DEFAULT '{}',     -- postavička a co má postavené (JSON, worker/logic.ts sanitizeSummary)
  save TEXT,                              -- záloha celého postupu (JSON)
  save_updated INTEGER
);
CREATE INDEX players_week ON players (week, week_points DESC);
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  kind TEXT NOT NULL,                     -- kolo, úloha, hodnocení… (jako řádky do tabulky Google)
  data TEXT NOT NULL
);
CREATE INDEX events_player ON events (player_id, ts);
